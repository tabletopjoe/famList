"use client";

import { useActionState, useRef } from "react";
import { changePassword, type ActionState } from "../actions";

const inputClass =
  "w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5";

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const action = async (prevState: ActionState, formData: FormData) => {
    const result = await changePassword(prevState, formData);
    if (result && "success" in result) {
      formRef.current?.reset();
    }
    return result;
  };
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-sm flex-col gap-3">
      <input
        name="currentPassword"
        type="password"
        placeholder="Current password"
        required
        className={inputClass}
      />
      <input name="newPassword" type="password" placeholder="New password" required className={inputClass} />
      <input
        name="confirmPassword"
        type="password"
        placeholder="Confirm new password"
        required
        className={inputClass}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
      {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-green-600">Password updated.</p>}
    </form>
  );
}
