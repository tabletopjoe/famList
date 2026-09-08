"use client";

import { useTransition } from "react";
import { deleteContact } from "../actions";

type ContactCardProps = {
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    relationship: string | null;
    phone: string | null;
    email: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    notes: string | null;
  };
};

export function ContactCard({ contact }: ContactCardProps) {
  const [isPending, startTransition] = useTransition();
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const cityStateZip = [
    [contact.city, contact.state].filter(Boolean).join(", "),
    contact.zip,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15">
      <div className="space-y-1">
        <p className="font-medium">
          {fullName}
          {contact.relationship && (
            <span className="ml-2 text-sm font-normal text-black/50 dark:text-white/50">
              {contact.relationship}
            </span>
          )}
        </p>
        {contact.phone && <p className="text-sm">{contact.phone}</p>}
        {contact.email && <p className="text-sm">{contact.email}</p>}
        {contact.address1 && (
          <p className="text-sm text-black/60 dark:text-white/60">{contact.address1}</p>
        )}
        {contact.address2 && (
          <p className="text-sm text-black/60 dark:text-white/60">{contact.address2}</p>
        )}
        {cityStateZip && (
          <p className="text-sm text-black/60 dark:text-white/60">{cityStateZip}</p>
        )}
        {contact.notes && <p className="text-sm text-black/50 dark:text-white/50">{contact.notes}</p>}
      </div>
      <button
        onClick={() => {
          if (confirm(`Delete ${fullName || "this contact"}?`)) {
            startTransition(() => deleteContact(contact.id));
          }
        }}
        disabled={isPending}
        className="text-sm text-black/40 hover:text-red-600 disabled:opacity-50"
        aria-label={`Delete ${fullName}`}
      >
        ✕
      </button>
    </div>
  );
}
