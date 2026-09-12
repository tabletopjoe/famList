import "server-only";
import { db } from "@/lib/db";

export function getLists() {
  return db.list.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
}

/** A user's default/primary list is their own preference now, not a property of the list itself. */
export async function getPrimaryList(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { primaryListId: true } });
  if (!user?.primaryListId) return null;
  return db.list.findUnique({ where: { id: user.primaryListId } });
}

export function getListWithItems(id: string) {
  return db.list.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ isDone: "asc" }, { position: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}
