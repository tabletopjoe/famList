"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import { hashPassword } from "@/lib/auth/password";
import { generateTempPassword } from "@/lib/generateTempPassword";

export type AdminActionState = { error: string } | { tempPassword: string; email: string } | undefined;

const CreateUserSchema = z.object({
  name: z.string().trim().min(1, { error: "Enter a name." }).max(100),
  email: z.email({ error: "Enter a valid email." }),
  role: z.enum(["member", "admin"], { error: "Choose a role." }),
});

/** Creates an account with a generated temp password (shown once) and mustChangePassword set — the /admin equivalent of prisma/seed.ts. */
export async function createUser(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = CreateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      mustChangePassword: true,
    },
  });

  revalidatePath("/admin");
  return { tempPassword, email: parsed.data.email };
}

/** Generates a fresh temp password for a user who's locked out — shown once, same as account creation. */
export async function resetUserPassword(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) {
    return { error: "Missing user." };
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) {
    return { error: "User not found." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidatePath("/admin");
  return { tempPassword, email: user.email };
}

/** Admins can't change their own role — avoids a self-lockout; ask another admin instead. */
export async function setUserRole(userId: string, role: string) {
  const currentUser = await requireAdmin();
  if (userId === currentUser.id) {
    throw new Error("You can't change your own role.");
  }
  if (role !== "admin" && role !== "member") {
    throw new Error("Invalid role.");
  }
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
}

/**
 * Permanently removes an account — same self-lockout guard as setUserRole.
 * List/Contact.createdBy has no onDelete set (defaults to restrict), so
 * their owned lists and contacts have to go first; everything under a
 * deleted list (items, categories, shares) cascades from that, and the
 * user's own ListShare/ContactSharePair rows cascade from deleting the User
 * row itself. Whoever had one of the deleted lists as primary just loses
 * that pointer (List.primaryFor is onDelete: SetNull), same as ordinary
 * list deletion.
 */
export async function deleteUser(userId: string) {
  const currentUser = await requireAdmin();
  if (userId === currentUser.id) {
    throw new Error("You can't delete your own account.");
  }
  await db.$transaction([
    db.list.deleteMany({ where: { createdById: userId } }),
    db.contact.deleteMany({ where: { createdById: userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);
  revalidatePath("/admin");
}
