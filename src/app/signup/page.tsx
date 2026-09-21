"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

const inputClass =
  "w-full rounded-md border border-foreground/10 px-3 py-2 text-sm dark:border-foreground/15 dark:bg-foreground/5";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">famList</h1>
        <div className="space-y-2">
          <input name="name" placeholder="Name" autoComplete="name" required className={inputClass} />
          <input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="username"
            required
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            required
            className={inputClass}
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            required
            className={inputClass}
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:bg-foreground/80 disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-foreground/60">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline hover:no-underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
