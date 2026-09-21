"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";

const LoginSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  password: z.string().min(1, { error: "Enter your password." }),
});

export type LoginState =
  | { error: string }
  | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  // Compare against a dummy hash when the user doesn't exist so login takes
  // roughly the same time either way (avoids leaking which emails are registered).
  const passwordMatches = await verifyPassword(
    password,
    user?.passwordHash ?? "$2a$10$invalidsaltinvalidsaltinuvKX8Qo5b2ZLZzJmzQfXW3xVQhyPO"
  );

  if (!user || !passwordMatches) {
    return { error: "Incorrect email or password." };
  }

  await createSession(user.id, user.mustChangePassword, user.theme, user.themeMode);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const SignupSchema = z
  .object({
    name: z.string().trim().min(1, { error: "Enter your name." }).max(100),
    email: z.email({ error: "Enter a valid email." }),
    password: z.string().min(8, { error: "Password must be at least 8 characters." }),
    confirmPassword: z.string().min(1, { error: "Re-enter your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Password and confirmation don't match.",
    path: ["confirmPassword"],
  });

export type SignupState = { error: string } | undefined;

/** Self-service signup, open to anyone — new accounts land as plain "member"s (never "admin") with mustChangePassword unset, since they've already picked their own. */
export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "member",
    },
  });

  await createSession(user.id, user.mustChangePassword, user.theme, user.themeMode);
  redirect("/");
}
