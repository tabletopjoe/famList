"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { setListShare } from "@/modules/settings/actions";

type OtherUser = { id: string; name: string };

const selectClass =
  "w-full rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-field-ink disabled:opacity-50";

/**
 * Per-list sharing, scoped to just this one list — lives inside
 * ListSettingsMenu's "Share with" CollapsibleSection, owner-only (see the
 * caller). Same underlying setListShare action as the cross-list Settings
 * page version, just without that one's person-then-lists flow: there's
 * only one list here, so a plain add-dropdown + removable roster is enough.
 */
export function ListShareManager({
  listId,
  otherUsers,
  sharedWithIds,
}: {
  listId: string;
  otherUsers: OtherUser[];
  sharedWithIds: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const shared = new Set(sharedWithIds);
  const sharedUsers = otherUsers.filter((u) => shared.has(u.id));
  const addableUsers = otherUsers.filter((u) => !shared.has(u.id));

  if (otherUsers.length === 0) {
    return <p className="text-sm text-foreground/50">No other family members to share with yet.</p>;
  }

  return (
    <div className="space-y-3">
      {addableUsers.length > 0 && (
        <select
          value=""
          disabled={isPending}
          onChange={(e) => {
            const userId = e.target.value;
            if (userId) startTransition(() => setListShare(listId, userId, true));
          }}
          className={selectClass}
        >
          <option value="" className="bg-white/80 text-field-ink">
            Share with…
          </option>
          {addableUsers.map((u) => (
            <option key={u.id} value={u.id} className="bg-white/80 text-field-ink">
              {u.name}
            </option>
          ))}
        </select>
      )}
      {sharedUsers.length > 0 ? (
        <ul className="space-y-1">
          {sharedUsers.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-sm">
              <span className="truncate">{u.name}</span>
              <button
                type="button"
                onClick={() => startTransition(() => setListShare(listId, u.id, false))}
                disabled={isPending}
                aria-label={`Stop sharing with ${u.name}`}
                title="Remove"
                className="shrink-0 text-foreground/40 hover:text-red-400 active:text-red-500 disabled:opacity-50"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-foreground/50">Not shared with anyone yet.</p>
      )}
    </div>
  );
}
