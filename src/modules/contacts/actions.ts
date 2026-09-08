"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth/dal";

export type ActionState = { error: string } | undefined;

const CreateContactSchema = z.object({
  firstName: z.string().trim().min(1, { error: "First name is required." }).max(80),
  lastName: z.string().trim().max(80).optional(),
  relationship: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.email({ error: "Enter a valid email." }).optional().or(z.literal("")),
  address1: z.string().trim().max(200).optional(),
  address2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(50).optional(),
  zip: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(1000).optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export async function createContact(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await verifySession();

  const parsed = CreateContactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: emptyToUndefined(formData.get("lastName")),
    relationship: emptyToUndefined(formData.get("relationship")),
    phone: emptyToUndefined(formData.get("phone")),
    email: emptyToUndefined(formData.get("email")) ?? "",
    address1: emptyToUndefined(formData.get("address1")),
    address2: emptyToUndefined(formData.get("address2")),
    city: emptyToUndefined(formData.get("city")),
    state: emptyToUndefined(formData.get("state")),
    zip: emptyToUndefined(formData.get("zip")),
    notes: emptyToUndefined(formData.get("notes")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { email, ...rest } = parsed.data;
  await db.contact.create({
    data: { ...rest, email: email || undefined, createdById: session.userId },
  });
  revalidatePath("/contacts");
}

export async function deleteContact(contactId: string) {
  await verifySession();
  await db.contact.delete({ where: { id: contactId } });
  revalidatePath("/contacts");
}
