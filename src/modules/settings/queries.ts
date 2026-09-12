import "server-only";
import { db } from "@/lib/db";

/** Everyone but yourself — the set of people you could possibly share a list or your contacts with. */
export function getOtherUsers(userId: string) {
  return db.user.findMany({
    where: { id: { not: userId } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
