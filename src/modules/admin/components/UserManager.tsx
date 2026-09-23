"use client";

import { useState } from "react";
import { UserSearchPicker } from "@/components/UserSearchPicker";
import { UserRow } from "./UserRow";

type User = { id: string; name: string; email: string; role: string; mustChangePassword: boolean };

/**
 * Search-to-select rather than always rendering every account — same
 * pattern as list/contact sharing (see UserSearchPicker). Selecting someone
 * shows their existing role/reset-password controls plus Delete. If the
 * selected account gets deleted, `users` (refetched via deleteUser's
 * revalidatePath) no longer contains their id, `selected` falls back to
 * null, and this drops back to the search view on its own.
 */
export function UserManager({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = users.find((u) => u.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-sm text-foreground/60 hover:text-foreground active:opacity-70"
        >
          ← Back to search
        </button>
        <UserRow user={selected} isSelf={selected.id === currentUserId} />
      </div>
    );
  }

  return <UserSearchPicker users={users} onSelect={setSelectedId} placeholder="Search users…" />;
}
