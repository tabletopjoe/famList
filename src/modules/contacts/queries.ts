import "server-only";
import { db } from "@/lib/db";

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

export async function getContacts(userId: string) {
  const ownerIds = await getVisibleContactOwnerIds(userId);
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
