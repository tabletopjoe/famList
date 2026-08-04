import "server-only";
import { db } from "@/lib/db";

export function getContacts() {
  return db.contact.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}
