"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { setContactSharing } from "../actions";
import { UserSearchPicker } from "@/components/UserSearchPicker";

type OtherUser = { id: string; name: string };

/**
 * Mutual and all-or-nothing — one ContactSharePair covers the whole
 * collection both ways (see setContactSharing). Same search-to-add +
 * removable-roster pattern as ListShareManager, just without a listId.
 */
export function ContactSharingSection({
  otherUsers,
  sharedWithIds,
}: {
  otherUsers: OtherUser[];
  sharedWithIds: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const shared = new Set(sharedWithIds);
  const sharedUsers = otherUsers.filter((u) => shared.has(u.id));
  const addableUsers = otherUsers.filter((u) => !shared.has(u.id));

  if (otherUsers.length === 0) {
    return <p className="text-sm text-foreground/60">No other family members to share with yet.</p>;
  }

  return (
    <div className="space-y-3">
      {addableUsers.length > 0 && (
        <UserSearchPicker
          users={addableUsers}
          onSelect={(userId) => startTransition(() => setContactSharing(userId, true))}
          placeholder="Share with…"
          disabled={isPending}
        />
      )}
      {sharedUsers.length > 0 ? (
        <ul className="space-y-1">
          {sharedUsers.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-sm">
              <span className="truncate">{u.name}</span>
              <button
                type="button"
                onClick={() => startTransition(() => setContactSharing(u.id, false))}
                disabled={isPending}
                aria-label={`Stop sharing contacts with ${u.name}`}
                title="Remove"
                className="shrink-0 text-foreground/40 hover:text-red-400 active:text-red-500 disabled:opacity-50"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-foreground/50">Not sharing your contacts with anyone yet.</p>
      )}
    </div>
  );
}
