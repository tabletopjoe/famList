"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth/dal";
import { canAccessList, visibleToUser } from "./queries";
import {
  COMPLETED_STATUS,
  LIST_KINDS,
  PRESET_CATEGORIES,
  PRESET_STATUSES,
  REOPENED_STATUS,
  RESET_INTERVAL_DAYS,
  type ListKind,
} from "./types";

export type ActionState = { error: string } | undefined;

// A blunt per-account cap, same spirit as MAX_USERS in actions/auth.ts —
// Neon's free tier has a small storage ceiling, and this is cheap insurance
// against one account (or a script) creating unbounded lists. Well above any
// real family's actual list count.
const MAX_LISTS_PER_USER = 300;

/** Throws if userId can't view/edit listId (not the creator, not shared with them). */
async function requireListAccess(userId: string, listId: string) {
  if (!(await canAccessList(userId, listId))) {
    throw new Error("You don't have access to this list.");
  }
}

const CreateListSchema = z.object({
  title: z.string().trim().min(1, { error: "Give the list a name." }).max(120),
  // Falls back to shopping (the schema column's own default) if the type
  // selector wasn't shown yet — see CreateListForm, which only renders it
  // once the title field is focused.
  kind: z.enum(LIST_KINDS).default("shopping"),
});

export async function createList(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await verifySession();
  const parsed = CreateListSchema.safeParse({ title: formData.get("title"), kind: formData.get("kind") || undefined });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid title." };
  }

  const listCount = await db.list.count({ where: { createdById: session.userId } });
  if (listCount >= MAX_LISTS_PER_USER) {
    return { error: `You've hit the ${MAX_LISTS_PER_USER}-list limit per account. Delete an old list to make room.` };
  }

  // Lists index sorts by position ascending — one below the lowest position
  // this user can currently see puts a new list at the top, matching the
  // old newest-first default.
  const { _min } = await db.list.aggregate({ where: visibleToUser(session.userId), _min: { position: true } });
  const position = (_min.position ?? 0) - 1;
  const list = await db.list.create({
    data: { title: parsed.data.title, createdById: session.userId, kind: parsed.data.kind, position },
  });

  await ensurePresets(list.id, parsed.data.kind);

  revalidatePath("/lists");
  redirect(`/lists/${list.id}`);
}

export async function deleteList(listId: string) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  await db.list.delete({ where: { id: listId } });
  revalidatePath("/lists");
  redirect("/lists");
}

/**
 * Persists a drag-reordered lists index (mobile touch-and-drag, same
 * pattern as reorderItems). The index can be showing a filtered subset
 * (mine/shared/all — see OwnershipFilterChips), so this only reassigns
 * positions *among the ids given*: it takes their current position values
 * as a set and redistributes that same set across them in the new order,
 * rather than renumbering 0..N. That leaves any list outside the current
 * filter exactly where it was, interleaved correctly either way.
 */
export async function reorderLists(orderedIds: string[]) {
  const session = await verifySession();
  const lists = await db.list.findMany({
    where: { id: { in: orderedIds }, ...visibleToUser(session.userId) },
    select: { id: true, position: true },
  });
  if (lists.length !== orderedIds.length) return;

  const positions = lists.map((l) => l.position).sort((a, b) => a - b);

  await db.$transaction(
    orderedIds.map((id, i) => db.list.update({ where: { id }, data: { position: positions[i] } })),
  );
  revalidatePath("/lists");
}

/** A user's primary list is their own preference (User.primaryListId) — setting it is just an overwrite. */
export async function setPrimaryList(listId: string, makePrimary: boolean) {
  const session = await verifySession();
  if (makePrimary) {
    await requireListAccess(session.userId, listId);
  }
  await db.user.update({
    where: { id: session.userId },
    data: { primaryListId: makePrimary ? listId : null },
  });
  revalidatePath("/lists");
}

/**
 * List settings (kind, reset interval) follow the same access rule as the
 * list's content, not the owner-only rule sharing uses — anyone the list
 * is shared with can change these too, same as they can rename or delete
 * it.
 */
export async function setListKind(listId: string, rawKind: string) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  const parsed = z.enum(LIST_KINDS).safeParse(rawKind);
  if (!parsed.success) return;

  await db.list.update({
    where: { id: listId },
    data: {
      kind: parsed.data,
      // Only shopping lists use resetIntervalDays — clear it when leaving
      // that kind so switching back later starts from "no auto-reset"
      // rather than silently reviving whatever was set before. `undefined`
      // (not null) while staying "shopping" so a no-op call here can't
      // clobber an interval someone already set.
      resetIntervalDays: parsed.data === "shopping" ? undefined : null,
    },
  });
  await ensurePresets(listId, parsed.data);
  revalidatePath(`/lists/${listId}`);
}

/**
 * Tops a list up to its kind's preset categories (PRESET_CATEGORIES) and
 * statuses (PRESET_STATUSES) — adds whichever presets are missing,
 * appended after the existing ones, and never removes or reorders
 * anything. So switching kinds keeps everything the list already has
 * (user-added or left over from a previous kind) and just fills in the new
 * kind's defaults. Name match is case-insensitive so a user's "produce"
 * isn't doubled by a preset "Produce".
 */
async function ensurePresets(listId: string, kind: ListKind) {
  const [categories, statuses] = await Promise.all([
    db.category.findMany({ where: { listId }, select: { name: true, position: true } }),
    db.status.findMany({ where: { listId }, select: { name: true, position: true } }),
  ]);
  const newCategories = missingPresets(listId, categories, PRESET_CATEGORIES[kind]);
  const newStatuses = missingPresets(listId, statuses, PRESET_STATUSES[kind]);
  // skipDuplicates: a concurrent call (e.g. a double-submitted kind change)
  // may have just added the same preset — the [listId, name] unique makes
  // that a no-op.
  if (newCategories.length > 0) await db.category.createMany({ data: newCategories, skipDuplicates: true });
  if (newStatuses.length > 0) await db.status.createMany({ data: newStatuses, skipDuplicates: true });
}

function missingPresets(listId: string, existing: { name: string; position: number }[], presets: string[] | undefined) {
  if (!presets) return [];
  const have = new Set(existing.map((e) => e.name.toLowerCase()));
  const start = existing.reduce((max, e) => Math.max(max, e.position + 1), 0);
  return presets
    .filter((name) => !have.has(name.toLowerCase()))
    .map((name, i) => ({ listId, name, position: start + i }));
}

export async function setListResetInterval(listId: string, days: number | null) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  if (days !== null && !RESET_INTERVAL_DAYS.includes(days as (typeof RESET_INTERVAL_DAYS)[number])) {
    throw new Error("Invalid reset interval.");
  }
  await db.list.update({ where: { id: listId }, data: { resetIntervalDays: days } });
  revalidatePath(`/lists/${listId}`);
}

export type CreateCategoryResult = { error: string } | { category: { id: string; name: string } };

/** Appends a new category at the end of the list's set — called immediately (not deferred to a Save button) from both the list settings panel and ItemEditForm's "add a category" row. */
export async function createCategory(listId: string, rawName: string): Promise<CreateCategoryResult> {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  const name = rawName.trim();
  if (!name) return { error: "Enter a category name." };
  if (name.length > 60) return { error: "Category name is too long." };

  const count = await db.category.count({ where: { listId } });
  try {
    const category = await db.category.create({ data: { listId, name, position: count } });
    revalidatePath(`/lists/${listId}`);
    return { category: { id: category.id, name: category.name } };
  } catch {
    // Unique [listId, name] violation — same name already exists on this list.
    return { error: `"${name}" already exists.` };
  }
}

/** Items pointing at the deleted category fall back to none (onDelete: SetNull), not deleted themselves. */
export async function deleteCategory(listId: string, categoryId: string) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  await db.category.deleteMany({ where: { id: categoryId, listId } });
  revalidatePath(`/lists/${listId}`);
}

/** Same drag-reorder pattern as reorderItems/reorderLists — renumbers position to match the dropped order. */
export async function reorderCategories(listId: string, orderedIds: string[]) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  const categories = await db.category.findMany({ where: { listId }, select: { id: true } });
  if (orderedIds.length !== categories.length || !categories.every((c) => orderedIds.includes(c.id))) return;

  await db.$transaction(
    orderedIds.map((id, position) => db.category.update({ where: { id }, data: { position } })),
  );
  revalidatePath(`/lists/${listId}`);
}

export type CreateStatusResult = { error: string } | { status: { id: string; name: string } };

/** Project-list statuses — same add/delete/reorder shape as categories above (see Status in schema.prisma). */
export async function createStatus(listId: string, rawName: string): Promise<CreateStatusResult> {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  const name = rawName.trim();
  if (!name) return { error: "Enter a status name." };
  if (name.length > 60) return { error: "Status name is too long." };

  const count = await db.status.count({ where: { listId } });
  try {
    const status = await db.status.create({ data: { listId, name, position: count } });
    revalidatePath(`/lists/${listId}`);
    return { status: { id: status.id, name: status.name } };
  } catch {
    return { error: `"${name}" already exists.` };
  }
}

/** Items with the deleted status fall back to none (onDelete: SetNull). */
export async function deleteStatus(listId: string, statusId: string) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  await db.status.deleteMany({ where: { id: statusId, listId } });
  revalidatePath(`/lists/${listId}`);
}

export async function reorderStatuses(listId: string, orderedIds: string[]) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  const statuses = await db.status.findMany({ where: { listId }, select: { id: true } });
  if (orderedIds.length !== statuses.length || !statuses.every((st) => orderedIds.includes(st.id))) return;

  await db.$transaction(orderedIds.map((id, position) => db.status.update({ where: { id }, data: { position } })));
  revalidatePath(`/lists/${listId}`);
}

/** This list's status with the given name (case-insensitive), if it still has one — see COMPLETED_STATUS. */
async function findStatusId(listId: string, name: string): Promise<string | null> {
  const status = await db.status.findFirst({
    where: { listId, name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  return status?.id ?? null;
}

const AddItemSchema = z.object({
  label: z.string().trim().min(1, { error: "Enter an item name." }).max(200),
  quantity: z.string().trim().max(60).optional(),
  categoryId: z.string().optional(),
});

export async function addItem(listId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await verifySession();
  if (!(await canAccessList(session.userId, listId))) {
    return { error: "You don't have access to this list." };
  }
  const rawQuantity = formData.get("quantity");
  const parsed = AddItemSchema.safeParse({
    label: formData.get("label"),
    quantity: typeof rawQuantity === "string" && rawQuantity.trim() ? rawQuantity : undefined,
    categoryId: emptyToNull(formData.get("categoryId")) ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter an item name." };
  }

  // New items start undone, so append after the current undone items —
  // position only needs to order items within their own isDone group,
  // since isDone is the primary sort key (see getListWithItems).
  const position = await db.listItem.count({ where: { listId, isDone: false } });
  // Only accept a category that belongs to this list.
  let categoryId: string | null = null;
  if (parsed.data.categoryId) {
    const category = await db.category.findFirst({ where: { id: parsed.data.categoryId, listId }, select: { id: true } });
    categoryId = category?.id ?? null;
  }
  await db.listItem.create({
    data: { listId, label: parsed.data.label, quantity: parsed.data.quantity, position, categoryId },
  });
  revalidatePath(`/lists/${listId}`);
}

const UpdateItemSchema = z.object({
  label: z.string().trim().min(1, { error: "Enter an item name." }).max(200),
  quantity: z.string().trim().max(60).nullable(),
  notes: z.string().trim().max(1000).nullable(),
  link: z.string().trim().max(500).nullable(),
  categoryId: z.string().nullable(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Enter a valid date." });

const ProjectFieldsSchema = z
  .object({
    startDate: isoDate.nullable(),
    dueDate: isoDate.nullable(),
    person: z.string().trim().max(120).nullable(),
    statusId: z.string().nullable(),
    dependsOnId: z.string().nullable(),
  })
  // Same-format ISO date strings compare correctly as plain strings.
  .refine((f) => !f.startDate || !f.dueDate || f.dueDate >= f.startDate, {
    error: "Due date can't be before the start date.",
  });

/** A calendar day from an <input type="date"> — stored as UTC midnight (see ListItem.startDate in schema.prisma). */
function toDateOnly(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00Z`) : null;
}

/** "" (an emptied field) becomes null here rather than being left out of the update, so clearing a field in the edit form actually clears it. */
function emptyToNull(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export async function updateItem(
  listId: string,
  itemId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await verifySession();
  if (!(await canAccessList(session.userId, listId))) {
    return { error: "You don't have access to this list." };
  }
  const parsed = UpdateItemSchema.safeParse({
    label: formData.get("label"),
    quantity: emptyToNull(formData.get("quantity")),
    notes: emptyToNull(formData.get("notes")),
    link: emptyToNull(formData.get("link")),
    categoryId: emptyToNull(formData.get("categoryId")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid item." };
  }

  // The select is populated from this list's own categories, but re-check
  // rather than trust the submitted id outright — a category from another
  // list, or one deleted since the form opened, silently falls back to none.
  let categoryId = parsed.data.categoryId;
  if (categoryId) {
    const category = await db.category.findFirst({ where: { id: categoryId, listId }, select: { id: true } });
    categoryId = category?.id ?? null;
  }

  // Project fields are only on the form for project lists — anywhere else
  // they're left untouched rather than cleared, so they survive a kind
  // change back and forth (same as isRecurring).
  const list = await db.list.findUnique({ where: { id: listId }, select: { kind: true } });
  let projectData: ProjectItemData = {};
  if (list?.kind === "project") {
    const result = await parseProjectFields(listId, itemId, formData);
    if ("error" in result) return result;
    projectData = result.data;
  }

  await db.listItem.updateMany({
    where: { id: itemId, listId },
    data: { ...parsed.data, categoryId, ...projectData },
  });
  revalidatePath(`/lists/${listId}`);
}

type ProjectItemData = {
  startDate?: Date | null;
  dueDate?: Date | null;
  person?: string | null;
  statusId?: string | null;
  dependsOnId?: string | null;
  isDone?: boolean;
  completedAt?: Date | null;
};

/**
 * Validates a project item's extra fields and works out the checkbox side
 * effect of its status: switching to "Completed" checks it off (refused
 * while it's still waiting on its precursor), switching away from it
 * un-checks it. Any other status change leaves the checkbox alone.
 */
async function parseProjectFields(
  listId: string,
  itemId: string,
  formData: FormData,
): Promise<{ error: string } | { data: ProjectItemData }> {
  const parsed = ProjectFieldsSchema.safeParse({
    startDate: emptyToNull(formData.get("startDate")),
    dueDate: emptyToNull(formData.get("dueDate")),
    person: emptyToNull(formData.get("person")),
    statusId: emptyToNull(formData.get("statusId")),
    dependsOnId: emptyToNull(formData.get("dependsOnId")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter valid project details." };
  }
  const fields = parsed.data;

  const [statuses, items] = await Promise.all([
    db.status.findMany({ where: { listId }, select: { id: true, name: true } }),
    db.listItem.findMany({
      where: { listId },
      select: { id: true, label: true, isDone: true, statusId: true, dependsOnId: true },
    }),
  ]);
  const itemsById = new Map(items.map((i) => [i.id, i]));
  const item = itemsById.get(itemId);
  if (!item) return { error: "That item no longer exists." };

  // Same re-check as categoryId: ids from another list (or deleted since
  // the form opened) fall back to none.
  const statusId = fields.statusId && statuses.some((st) => st.id === fields.statusId) ? fields.statusId : null;
  const dependsOnId = fields.dependsOnId && itemsById.has(fields.dependsOnId) ? fields.dependsOnId : null;
  if (dependsOnId) {
    // Walk the precursor's own chain: reaching this item means the new link
    // would close a loop, locking every item in it for good.
    const seen = new Set<string>();
    for (let id: string | null = dependsOnId; id && !seen.has(id); id = itemsById.get(id)?.dependsOnId ?? null) {
      if (id === itemId) return { error: "That would make these items wait on each other." };
      seen.add(id);
    }
  }

  const data: ProjectItemData = {
    startDate: toDateOnly(fields.startDate),
    dueDate: toDateOnly(fields.dueDate),
    person: fields.person,
    statusId,
    dependsOnId,
  };
  const completedId = statuses.find((st) => st.name.toLowerCase() === COMPLETED_STATUS.toLowerCase())?.id;
  if (completedId && statusId !== item.statusId) {
    if (statusId === completedId && !item.isDone) {
      const precursor = dependsOnId ? itemsById.get(dependsOnId) : undefined;
      if (precursor && !precursor.isDone) {
        return { error: `Waiting on "${precursor.label}" — finish that first.` };
      }
      data.isDone = true;
      data.completedAt = new Date();
    } else if (item.statusId === completedId && item.isDone) {
      data.isDone = false;
      data.completedAt = null;
    }
  }
  return { data };
}

export async function toggleItem(listId: string, itemId: string, isDone: boolean) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  // findFirst on (id, listId) rather than by id alone so a mismatched
  // listId/itemId pair matches nothing instead of quietly touching a row in
  // a list other than the one access was just checked against.
  const item = await db.listItem.findFirst({
    where: { id: itemId, listId },
    select: { statusId: true, list: { select: { kind: true } }, dependsOn: { select: { isDone: true } } },
  });
  if (!item) return;

  const data: { isDone: boolean; completedAt: Date | null; statusId?: string | null } = {
    // completedAt tracks when isDone last flipped true, cleared when it
    // flips back — that's the clock resetStaleShoppingItems (queries.ts)
    // reads against the list's resetIntervalDays to auto-uncheck it later.
    // Setting it regardless of list kind is harmless: other kinds just
    // never read it back.
    isDone,
    completedAt: isDone ? new Date() : null,
  };

  if (item.list.kind === "project") {
    // Locked until its precursor is done — ItemRow disables the checkbox
    // too; this is the server-side backstop.
    if (isDone && item.dependsOn && !item.dependsOn.isDone) return;
    // Keep the status in step with the checkbox (see COMPLETED_STATUS).
    const completedId = await findStatusId(listId, COMPLETED_STATUS);
    if (completedId) {
      if (isDone) data.statusId = completedId;
      else if (item.statusId === completedId) data.statusId = await findStatusId(listId, REOPENED_STATUS);
    }
  }

  await db.listItem.update({ where: { id: itemId }, data });
  revalidatePath(`/lists/${listId}`);
}

/** Shopping-list items only (see ListItem.isRecurring in schema.prisma) — whether checking this off should auto-reset it later. */
export async function setItemRecurring(listId: string, itemId: string, isRecurring: boolean) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  await db.listItem.updateMany({ where: { id: itemId, listId }, data: { isRecurring } });
  revalidatePath(`/lists/${listId}`);
}

/**
 * Checking everything off can't strand a locked item (its precursor gets
 * checked off in the same sweep), so there's no dependency check here.
 * Project lists also move statuses along with the checkboxes, same as
 * toggleItem.
 */
export async function setAllItemsDone(listId: string, isDone: boolean) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  const list = await db.list.findUnique({ where: { id: listId }, select: { kind: true } });
  const completedId = list?.kind === "project" ? await findStatusId(listId, COMPLETED_STATUS) : null;
  const reopenedId = completedId && !isDone ? await findStatusId(listId, REOPENED_STATUS) : null;

  await db.$transaction([
    db.listItem.updateMany({
      where: { listId },
      data: { isDone, completedAt: isDone ? new Date() : null },
    }),
    ...(completedId
      ? [
          isDone
            ? db.listItem.updateMany({ where: { listId }, data: { statusId: completedId } })
            : db.listItem.updateMany({ where: { listId, statusId: completedId }, data: { statusId: reopenedId } }),
        ]
      : []),
  ]);
  revalidatePath(`/lists/${listId}`);
}

export async function deleteItem(listId: string, itemId: string) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  await db.listItem.deleteMany({ where: { id: itemId, listId } });
  revalidatePath(`/lists/${listId}`);
}

/**
 * Persists a full drag-reordered item list (mobile touch-and-drag). Trusts
 * the client for the *order* but not the grouping: rejects anything that
 * would move an item across the isDone boundary, since undone/done items
 * must stay contiguous for itemsOrderBy (queries.ts) to keep displaying
 * them as two blocks.
 */
export async function reorderItems(listId: string, orderedIds: string[]) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  const items = await db.listItem.findMany({ where: { listId }, select: { id: true, isDone: true } });
  const byId = new Map(items.map((i) => [i.id, i]));
  if (orderedIds.length !== items.length || !orderedIds.every((id) => byId.has(id))) return;

  let sawDone = false;
  for (const id of orderedIds) {
    const isDone = byId.get(id)!.isDone;
    if (isDone) sawDone = true;
    else if (sawDone) return;
  }

  await db.$transaction(
    orderedIds.map((id, position) => db.listItem.update({ where: { id }, data: { position } })),
  );
  revalidatePath(`/lists/${listId}`);
}
