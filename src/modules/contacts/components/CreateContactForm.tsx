"use client";

import { useActionState, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createContact } from "../actions";

export function CreateContactForm() {
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const action = async (prevState: Awaited<ReturnType<typeof createContact>>, formData: FormData) => {
    const result = await createContact(prevState, formData);
    if (!result?.error) {
      formRef.current?.reset();
      setExpanded(false);
    }
    return result;
  };
  const [state, formAction, pending] = useActionState(action, undefined);

  const inputClass =
    "rounded-md border border-foreground/10 px-3 py-2 text-sm dark:border-foreground/15 dark:bg-foreground/5";

  return (
    <div className="space-y-3 rounded-lg border border-foreground/10 p-4 dark:border-foreground/15">
      <div className="flex items-center justify-between">
        <p className="font-medium">Add a contact</p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Close the add-contact form" : "Add a contact"}
          title={expanded ? "Close" : "Add a contact"}
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground text-background"
        >
          <Plus className={`size-4 transition-transform ${expanded ? "rotate-45" : ""}`} strokeWidth={2} />
        </button>
      </div>
      {expanded && (
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          {/*
            Placed as 11 direct grid items (not two nested columns) so
            mobile and desktop can disagree about order: on mobile there's
            no sm:col-start/row-start, so it's just one column in plain DOM
            order (first, last, phone, email, address1, address2, city,
            state, zip, relationship, notes — the order requested for
            mobile). At sm+, explicit column/row placement regroups them
            into the original two visual columns (name/contact info/
            relationship/notes on the left, postal address on the right)
            regardless of that DOM order.
          */}
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:grid-rows-6">
            <input
              name="firstName"
              placeholder="First name"
              required
              className={`${inputClass} sm:col-start-1 sm:row-start-1`}
            />
            <input name="lastName" placeholder="Last name" className={`${inputClass} sm:col-start-2 sm:row-start-1`} />
            <input name="phone" placeholder="Phone" className={`${inputClass} sm:col-start-1 sm:row-start-2`} />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className={`${inputClass} sm:col-start-1 sm:row-start-3`}
            />
            <input
              name="address1"
              placeholder="Address 1"
              className={`${inputClass} sm:col-start-2 sm:row-start-2`}
            />
            <input
              name="address2"
              placeholder="Address 2"
              className={`${inputClass} sm:col-start-2 sm:row-start-3`}
            />
            <input name="city" placeholder="City" className={`${inputClass} sm:col-start-2 sm:row-start-4`} />
            <input name="state" placeholder="State" className={`${inputClass} sm:col-start-2 sm:row-start-5`} />
            <input name="zip" placeholder="Zip" className={`${inputClass} sm:col-start-2 sm:row-start-6`} />
            <input
              name="relationship"
              placeholder="Relationship (e.g. Grandma)"
              className={`${inputClass} sm:col-start-1 sm:row-start-4`}
            />
            <textarea
              name="notes"
              placeholder="Notes"
              className={`${inputClass} flex-1 resize-none sm:col-start-1 sm:row-start-5 sm:row-span-2`}
            />
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
      )}
    </div>
  );
}
