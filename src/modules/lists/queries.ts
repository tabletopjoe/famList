import "server-only";
import { db } from "@/lib/db";
import type { OwnershipFilter } from "@/components/OwnershipFilterChips";
import type { ListItemOrderByWithRelationInput, ListOrderByWithRelationInput } from "@/generated/prisma/models";
import type { ListSort, ListSortDir } from "./types";

/** A list is visible to its creator, or to anyone it's been explicitly shared with. */
export function visibleToUser(userId: string) {
  return { OR: [{ createdById: userId }, { shares: { some: { userId } } }] };
}

function whereForFilter(userId: string, filter: OwnershipFilter) {
  if (filter === "mine") return { createdById: userId };
  if (filter === "shared") return { createdById: { not: userId }, shares: { some: { userId } } };
  return visibleToUser(userId);
}

/** "custom" is drag order (List.position) and ignores dir — the rest are one-off query sorts — see ListSort in types.ts. */
function orderByForSort(sort: ListSort, dir: ListSortDir): ListOrderByWithRelationInput[] {
  if (sort === "name") return [{ title: dir }];
  if (sort === "created") return [{ createdAt: dir }];
  if (sort === "kind") return [{ kind: dir }, { position: "asc" }];
  return [{ position: "asc" }, { createdAt: "desc" }];
}

export function getLists(
  userId: string,
  filter: OwnershipFilter = "all",
  sort: ListSort = "custom",
  dir: ListSortDir = "asc",
) {
  return db.list.findMany({
    where: whereForFilter(userId, filter),
    orderBy: orderByForSort(sort, dir),
    include: { _count: { select: { items: true } } },
  });
}

/**
 * A user's default/primary list is their own preference now, not a property
 * of the list itself. Re-checks visibility rather than trusting the stored
 * pointer as-is: primaryListId only self-clears when the list is deleted
 * (onDelete: SetNull), not when a share to it is later revoked.
 */
export async function getPrimaryList(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { primaryListId: true } });
  if (!user?.primaryListId) return null;
  return db.list.findFirst({ where: { id: user.primaryListId, ...visibleToUser(userId) } });
}

const itemsOrderBy: ListItemOrderByWithRelationInput[] = [
  { isDone: "asc" },
  { position: "asc" },
  { createdAt: "asc" },
];

/**
 * Un-checks any item that's been done for at least resetIntervalDays —
 * shopping lists recur, so this is what lets you check things off during a
 * trip without re-adding them next time instead of deleting. Reconciled
 * lazily here (whenever the list is actually loaded) rather than via a
 * background job: nothing runs in this app unless a request comes in
 * (serverless, no cron), and "reset by the time someone next opens the
 * list" is all a family shopping list needs — nobody's watching it reset
 * itself unopened at 3am.
 */
async function resetStaleShoppingItems(listId: string, resetIntervalDays: number): Promise<number> {
  const cutoff = new Date(Date.now() - resetIntervalDays * 24 * 60 * 60 * 1000);
  const { count } = await db.listItem.updateMany({
    where: { listId, isDone: true, isRecurring: true, completedAt: { lte: cutoff } },
    data: { isDone: false, completedAt: null },
  });
  return count;
}

const listWithItemsInclude = {
  items: { orderBy: itemsOrderBy },
  categories: { orderBy: { position: "asc" as const } },
};

/** Null both when the list doesn't exist and when it exists but isn't visible to this user — same as a 404 either way. */
export async function getListWithItems(id: string, userId: string) {
  const list = await db.list.findFirst({
    where: { id, ...visibleToUser(userId) },
    include: listWithItemsInclude,
  });
  if (!list) return null;

  if (list.kind === "shopping" && list.resetIntervalDays != null) {
    const resetCount = await resetStaleShoppingItems(list.id, list.resetIntervalDays);
    if (resetCount > 0) {
      // Re-fetch rather than patch the in-memory items: cheap at this
      // scale, and avoids re-deriving the isDone/position resort by hand.
      return db.list.findFirst({ where: { id }, include: listWithItemsInclude });
    }
  }

  return list;
}

/** Whether userId can view/edit listId — created it, or it's been shared with them. Sharing is full-edit, not view-only. */
export async function canAccessList(userId: string, listId: string): Promise<boolean> {
  const list = await db.list.findFirst({
    where: { id: listId, ...visibleToUser(userId) },
    select: { id: true },
  });
  return !!list;
}

/**
 * Lists this user owns, with who they're currently shared with — for the
 * sharing UI in /settings. Only the owner manages a list's sharing, even
 * though everyone it's shared with gets full edit access to its content.
 */
export function getOwnedListsWithShares(userId: string) {
  return db.list.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, shares: { select: { userId: true } } },
  });
}
