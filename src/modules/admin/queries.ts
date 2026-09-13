import "server-only";
import { db } from "@/lib/db";

export function getAllUsers() {
  return db.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });
}
