import "server-only";
import { db } from "@/lib/db";
import type { OwnershipFilter } from "@/components/OwnershipFilterChips";

/**
 * IDs of users whose contacts userId can see: themselves, plus anyone they
 * mutually share contacts with (ContactSharePair — all-or-nothing per pair,
 * not per-contact). Kept separate from the actual contact query so a future
 * per-contact grant (e.g. "send this one contact to this one user") can
 * union into this same function without reworking every caller.
 */
export async function getVisibleContactOwnerIds(userId: string): Promise<string[]> {
  const pairs = await db.contactSharePair.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { userAId: true, userBId: true },
  });
  const others = pairs.map((pair) => (pair.userAId === userId ? pair.userBId : pair.userAId));
  return [userId, ...others];
}

export async function getContacts(userId: string, filter: OwnershipFilter = "all") {
  let ownerIds: string[];
  if (filter === "mine") {
    ownerIds = [userId];
  } else {
    const visible = await getVisibleContactOwnerIds(userId);
    ownerIds = filter === "shared" ? visible.filter((id) => id !== userId) : visible;
  }
  return db.contact.findMany({
    where: { createdById: { in: ownerIds } },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

/** Whether userId can view/edit contactId — created it, or shares contacts with whoever did. */
export async function canAccessContact(userId: string, contactId: string): Promise<boolean> {
  const contact = await db.contact.findUnique({ where: { id: contactId }, select: { createdById: true } });
  if (!contact) return false;
  const ownerIds = await getVisibleContactOwnerIds(userId);
  return ownerIds.includes(contact.createdById);
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

export async function getContactsCsv(userId: string): Promise<string> {
  const ownerIds = await getVisibleContactOwnerIds(userId);
  const contacts = await db.contact.findMany({
    where: { createdById: { in: ownerIds } },
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
