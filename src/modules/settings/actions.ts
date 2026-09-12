"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth/dal";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export type ActionState = { error: string } | { success: true } | undefined;

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Enter your current password." }),
    newPassword: z.string().min(8, { error: "New password must be at least 8 characters." }),
    confirmPassword: z.string().min(1, { error: "Re-enter the new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "New password and confirmation don't match.",
    path: ["confirmPassword"],
  });

export async function changePassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await verifySession();
  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { error: "Your account could not be found." };
  }

  const currentMatches = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!currentMatches) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  // The mustChangePassword flag is baked into the session cookie (so
  // proxy.ts can redirect at the edge without a DB call) — reissue it here
  // so the flag flips off immediately instead of waiting for the cookie's
  // natural 30-day expiry.
  await createSession(user.id, false);

  return { success: true };
}
