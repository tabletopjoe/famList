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

const CSV_COLUMNS = [
  "First name",
  "Last name",
  "Relationship",
  "Phone",
  "Email",
  "Address 1",
  "Address 2",
  "City",
  "State",
  "Zip",
  "Birthday",
  "Notes",
] as const;

// Wraps a field in quotes (and doubles up any inner quotes) whenever it
// contains a comma, quote, or newline — the minimum CSV escaping needed for
// a file that opens cleanly in Excel/Sheets/Numbers.
function csvField(value: string | null | undefined) {
  const text = value ?? "";
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function exportContactsCsv() {
  await verifySession();
  const contacts = await db.contact.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const rows = contacts.map((contact) =>
    [
      contact.firstName,
      contact.lastName,
      contact.relationship,
      contact.phone,
      contact.email,
      contact.address1,
      contact.address2,
      contact.city,
      contact.state,
      contact.zip,
      contact.birthday ? contact.birthday.toISOString().slice(0, 10) : null,
      contact.notes,
    ]
      .map(csvField)
      .join(",")
  );

  return [CSV_COLUMNS.join(","), ...rows].join("\r\n");
}
