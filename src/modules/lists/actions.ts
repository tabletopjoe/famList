"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth/dal";
import { canAccessList, visibleToUser } from "./queries";
import { LIST_KINDS, PRESET_CATEGORIES, RESET_INTERVAL_DAYS } from "./types";

export type ActionState = { error: string } | undefined;

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

  // Lists index sorts by position ascending — one below the lowest position
  // this user can currently see puts a new list at the top, matching the
  // old newest-first default.
  const { _min } = await db.list.aggregate({ where: visibleToUser(session.userId), _min: { position: true } });
  const position = (_min.position ?? 0) - 1;
  const list = await db.list.create({
    data: { title: parsed.data.title, createdById: session.userId, kind: parsed.data.kind, position },
  });

  const presets = PRESET_CATEGORIES[parsed.data.kind];
  if (presets) {
    await db.category.createMany({
      data: presets.map((name, i) => ({ listId: list.id, name, position: i })),
    });
  }

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
  revalidatePath(`/lists/${listId}`);
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

const AddItemSchema = z.object({
  label: z.string().trim().min(1, { error: "Enter an item name." }).max(200),
  quantity: z.string().trim().max(60).optional(),
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
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter an item name." };
  }

  // New items start undone, so append after the current undone items —
  // position only needs to order items within their own isDone group,
  // since isDone is the primary sort key (see getListWithItems).
  const position = await db.listItem.count({ where: { listId, isDone: false } });
  await db.listItem.create({
    data: { listId, label: parsed.data.label, quantity: parsed.data.quantity, position },
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

  await db.listItem.updateMany({
    where: { id: itemId, listId },
    data: { ...parsed.data, categoryId },
  });
  revalidatePath(`/lists/${listId}`);
}

export async function toggleItem(listId: string, itemId: string, isDone: boolean) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  // updateMany (rather than update by id alone) so a mismatched listId/itemId
  // pair silently matches nothing instead of quietly touching a row in a
  // list other than the one access was just checked against.
  //
  // completedAt tracks when isDone last flipped true, cleared when it flips
  // back — that's the clock resetStaleShoppingItems (queries.ts) reads
  // against the list's resetIntervalDays to auto-uncheck it later. Setting
  // it here regardless of list kind is harmless: collection/notes lists
  // just never read it back.
  await db.listItem.updateMany({
    where: { id: itemId, listId },
    data: { isDone, completedAt: isDone ? new Date() : null },
  });
  revalidatePath(`/lists/${listId}`);
}

/** Shopping-list items only (see ListItem.isRecurring in schema.prisma) — whether checking this off should auto-reset it later. */
export async function setItemRecurring(listId: string, itemId: string, isRecurring: boolean) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  await db.listItem.updateMany({ where: { id: itemId, listId }, data: { isRecurring } });
  revalidatePath(`/lists/${listId}`);
}

export async function setAllItemsDone(listId: string, isDone: boolean) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  await db.listItem.updateMany({
    where: { listId },
    data: { isDone, completedAt: isDone ? new Date() : null },
  });
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
