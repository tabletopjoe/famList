"use client";

import { useTransition } from "react";
import { setContactSharing } from "../actions";

type OtherUser = { id: string; name: string };

/** Mutual and all-or-nothing — one toggle per family member shares your whole contact collection with theirs, both ways. */
export function ContactSharingSection({
  otherUsers,
  sharedWithIds,
}: {
  otherUsers: OtherUser[];
  sharedWithIds: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const shared = new Set(sharedWithIds);

  if (otherUsers.length === 0) {
    return <p className="text-sm text-white/60">No other family members to share with yet.</p>;
  }

  return (
    <div className="space-y-2">
      {otherUsers.map((user) => (
        <label key={user.id} className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={shared.has(user.id)}
            disabled={isPending}
            onChange={(e) => startTransition(() => setContactSharing(user.id, e.target.checked))}
            className="size-4"
          />
          Share contacts with {user.name}
        </label>
      ))}
    </div>
  );
}
