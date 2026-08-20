"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth/dal";

export type ActionState = { error: string } | undefined;

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
  await verifySession();
  await db.list.delete({ where: { id: listId } });
  revalidatePath("/lists");
  redirect("/lists");
}

/** At most one list is primary at a time — setting one unsets any other. */
export async function setPrimaryList(listId: string, makePrimary: boolean) {
  await verifySession();
  if (makePrimary) {
    await db.$transaction([
      db.list.updateMany({ where: { isPrimary: true }, data: { isPrimary: false } }),
      db.list.update({ where: { id: listId }, data: { isPrimary: true } }),
    ]);
  } else {
    await db.list.update({ where: { id: listId }, data: { isPrimary: false } });
  }
  revalidatePath("/lists");
}

const AddItemSchema = z.object({
  label: z.string().trim().min(1, { error: "Enter an item name." }).max(200),
  quantity: z.string().trim().max(60).optional(),
});

export async function addItem(listId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  await verifySession();
  const rawQuantity = formData.get("quantity");
  const parsed = AddItemSchema.safeParse({
    label: formData.get("label"),
    quantity: typeof rawQuantity === "string" && rawQuantity.trim() ? rawQuantity : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter an item name." };
  }

  await db.listItem.create({
    data: { listId, label: parsed.data.label, quantity: parsed.data.quantity },
  });
  revalidatePath(`/lists/${listId}`);
}

export async function toggleItem(listId: string, itemId: string, isDone: boolean) {
  await verifySession();
  await db.listItem.update({ where: { id: itemId }, data: { isDone } });
  revalidatePath(`/lists/${listId}`);
}

export async function deleteItem(listId: string, itemId: string) {
  await verifySession();
  await db.listItem.delete({ where: { id: itemId } });
  revalidatePath(`/lists/${listId}`);
}
