import "server-only";
import { db } from "@/lib/db";

/** A list is visible to its creator, or to anyone it's been explicitly shared with. */
function visibleToUser(userId: string) {
  return { OR: [{ createdById: userId }, { shares: { some: { userId } } }] };
}

export function getLists(userId: string) {
  return db.list.findMany({
    where: visibleToUser(userId),
    orderBy: { createdAt: "desc" },
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

/** Null both when the list doesn't exist and when it exists but isn't visible to this user — same as a 404 either way. */
export function getListWithItems(id: string, userId: string) {
  return db.list.findFirst({
    where: { id, ...visibleToUser(userId) },
    include: {
      items: {
        orderBy: [{ isDone: "asc" }, { position: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

/** Whether userId can view/edit listId — created it, or it's been shared with them. Sharing is full-edit, not view-only. */
export async function canAccessList(userId: string, listId: string): Promise<boolean> {
  const list = await db.list.findFirst({
    where: { id: listId, ...visibleToUser(userId) },
    select: { id: true },
  });
  return !!list;
}
