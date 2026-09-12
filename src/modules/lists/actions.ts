"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth/dal";
import { canAccessList } from "./queries";

export type ActionState = { error: string } | undefined;

/** Throws if userId can't view/edit listId (not the creator, not shared with them). */
async function requireListAccess(userId: string, listId: string) {
  if (!(await canAccessList(userId, listId))) {
    throw new Error("You don't have access to this list.");
  }
}

const CreateListSchema = z.object({
  title: z.string().trim().min(1, { error: "Give the list a name." }).max(120),
});

export async function createList(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await verifySession();
  const parsed = CreateListSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid title." };
  }

  const list = await db.list.create({
    data: { title: parsed.data.title, createdById: session.userId },
  });
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

export async function toggleItem(listId: string, itemId: string, isDone: boolean) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  // updateMany (rather than update by id alone) so a mismatched listId/itemId
  // pair silently matches nothing instead of quietly touching a row in a
  // list other than the one access was just checked against.
  await db.listItem.updateMany({ where: { id: itemId, listId }, data: { isDone } });
  revalidatePath(`/lists/${listId}`);
}

export async function deleteItem(listId: string, itemId: string) {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  await db.listItem.deleteMany({ where: { id: itemId, listId } });
  revalidatePath(`/lists/${listId}`);
}

/** Swaps an item with its neighbor in the same isDone group and renormalizes positions to match. */
export async function moveItem(listId: string, itemId: string, direction: "up" | "down") {
  const session = await verifySession();
  await requireListAccess(session.userId, listId);
  const items = await db.listItem.findMany({
    where: { listId },
    orderBy: [{ isDone: "asc" }, { position: "asc" }, { createdAt: "asc" }],
  });
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  const neighbor = items[swapIdx];
  if (!neighbor || neighbor.isDone !== items[idx].isDone) return;

  const order = items.map((i) => i.id);
  [order[idx], order[swapIdx]] = [order[swapIdx], order[idx]];

  await db.$transaction(order.map((id, position) => db.listItem.update({ where: { id }, data: { position } })));
  revalidatePath(`/lists/${listId}`);
}
