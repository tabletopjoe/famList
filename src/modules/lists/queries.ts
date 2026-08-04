import "server-only";
import { db } from "@/lib/db";

export function getLists() {
  return db.list.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
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
