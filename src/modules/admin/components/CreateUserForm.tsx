"use client";

import { useActionState, useRef } from "react";
import { createUser, type AdminActionState } from "../actions";

const inputClass =
  "w-full rounded-md border border-foreground/10 px-3 py-2 text-sm dark:border-foreground/15 dark:bg-foreground/5";

export function CreateUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const action = async (prevState: AdminActionState, formData: FormData) => {
    const result = await createUser(prevState, formData);
    if (result && "tempPassword" in result) {
      formRef.current?.reset();
    }
    return result;
  };
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-sm flex-col gap-3">
      <input name="name" placeholder="Name" required className={inputClass} />
      <input name="email" type="email" placeholder="Email" required className={inputClass} />
      <select name="role" defaultValue="member" className={inputClass}>
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:bg-foreground/80 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
      {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
      {state && "tempPassword" in state && (
        <p className="text-sm text-green-500">
          Created {state.email} — temp password <span className="font-mono">{state.tempPassword}</span>. Share
          this once; they&apos;ll be made to set their own on first login.
        </p>
      )}
    </form>
  );
}
