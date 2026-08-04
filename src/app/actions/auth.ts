"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";

// There's deliberately no public sign-up action here. This app is hosted
// for the family, not the internet at large — accounts are created via
// `npm run db:seed` (see prisma/seed.ts). Add family members there.

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

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
