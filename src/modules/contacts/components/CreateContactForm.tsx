"use client";

import { useActionState, useRef } from "react";
import { createContact } from "../actions";

export function CreateContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const action = async (prevState: Awaited<ReturnType<typeof createContact>>, formData: FormData) => {
    const result = await createContact(prevState, formData);
    if (!result?.error) {
      formRef.current?.reset();
    }
    return result;
  };
  const [state, formAction, pending] = useActionState(action, undefined);

  const inputClass =
    "rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15">
      <p className="font-medium">Add a contact</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <input name="firstName" placeholder="First name" required className={inputClass} />
          <input name="phone" placeholder="Phone" className={inputClass} />
          <input name="email" type="email" placeholder="Email" className={inputClass} />
          <input name="relationship" placeholder="Relationship (e.g. Grandma)" className={inputClass} />
          <textarea name="notes" placeholder="Notes" className={`${inputClass} flex-1 resize-none`} />
        </div>
        <div className="flex flex-col gap-3">
          <input name="lastName" placeholder="Last name" className={inputClass} />
          <input name="address1" placeholder="Address 1" className={inputClass} />
          <input name="address2" placeholder="Address 2" className={inputClass} />
          <input name="city" placeholder="City" className={inputClass} />
          <input name="state" placeholder="State" className={inputClass} />
          <input name="zip" placeholder="Zip" className={inputClass} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save contact"}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
