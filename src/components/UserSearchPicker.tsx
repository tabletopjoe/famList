"use client";

import { useState } from "react";

type User = { id: string; name: string };

/**
 * Type-to-filter replacement for a plain <select> of users — used wherever
 * picking someone to share a list with needs to scale past a quick glance
 * down a short dropdown (Settings' cross-list sharing, and each list's own
 * "Share with"). Shows every candidate until you narrow it by typing;
 * selecting one clears the query so the field is ready for the next pick.
 */
export function UserSearchPicker({
  users,
  onSelect,
  placeholder = "Search for someone…",
  disabled,
}: {
  users: User[];
  onSelect: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();
  const matches = trimmed ? users.filter((u) => u.name.toLowerCase().includes(trimmed)) : users;

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-field-ink placeholder:text-field-ink/40 disabled:opacity-50"
      />
      {matches.length > 0 ? (
        <ul className="max-h-40 divide-y divide-black/10 overflow-y-auto rounded-md border border-black/15 bg-white/80">
          {matches.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onSelect(u.id);
                  setQuery("");
                }}
                className="block w-full px-2 py-1.5 text-left text-sm text-field-ink hover:bg-black/5 active:bg-black/10 disabled:opacity-50"
              >
                {u.name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-field-ink/50">
          No matches.
        </p>
      )}
    </div>
  );
}
