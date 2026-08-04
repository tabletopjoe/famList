"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">famList</h1>
        <div className="space-y-2">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
