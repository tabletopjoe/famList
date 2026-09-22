"use client";

import { useState, useTransition } from "react";
import { setListShare } from "../actions";
import { chipClass } from "@/components/chipClass";
import { UserSearchPicker } from "@/components/UserSearchPicker";

type OtherUser = { id: string; name: string };
type OwnedList = { id: string; title: string; shares: { userId: string }[] };

/**
 * Person-first rather than the old list-first grid (a checkbox per user on
 * every list row) — that stopped scaling once there were more than a
 * handful of lists. Pick someone (either fresh, via the search field, or
 * from the roster of people you already share something with), then toggle
 * which of your lists they can see. Only one person "focused" at a time —
 * see focusedUserId below.
 */
export function ListSharingSection({ lists, otherUsers }: { lists: OwnedList[]; otherUsers: OtherUser[] }) {
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (lists.length === 0) {
    return <p className="text-sm text-foreground/60">You don&apos;t own any lists yet.</p>;
  }
  if (otherUsers.length === 0) {
    return <p className="text-sm text-foreground/60">No other family members to share with yet.</p>;
  }

  const sharedWithIds = new Set(lists.flatMap((list) => list.shares.map((share) => share.userId)));
  const alreadySharedUsers = otherUsers.filter((u) => sharedWithIds.has(u.id));
  const addableUsers = otherUsers.filter((u) => !sharedWithIds.has(u.id));
  const focusedUser = otherUsers.find((u) => u.id === focusedUserId) ?? null;

  if (focusedUser) {
    const sharedListIds = new Set(
      lists.filter((list) => list.shares.some((share) => share.userId === focusedUser.id)).map((list) => list.id),
    );
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Sharing with {focusedUser.name}</p>
          <button
            type="button"
            onClick={() => setFocusedUserId(null)}
            className="shrink-0 text-sm text-foreground/60 hover:text-foreground active:opacity-70"
          >
            Done
          </button>
        </div>
        <div className="space-y-1">
          {lists.map((list) => (
            <label key={list.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sharedListIds.has(list.id)}
                disabled={isPending}
                onChange={(e) => startTransition(() => setListShare(list.id, focusedUser.id, e.target.checked))}
                className="size-4"
              />
              {list.title}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addableUsers.length > 0 && (
        <UserSearchPicker
          users={addableUsers}
          onSelect={setFocusedUserId}
          placeholder="Share with someone new…"
        />
      )}
      {alreadySharedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alreadySharedUsers.map((u) => (
            <button key={u.id} type="button" onClick={() => setFocusedUserId(u.id)} className={chipClass(true)}>
              {u.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
