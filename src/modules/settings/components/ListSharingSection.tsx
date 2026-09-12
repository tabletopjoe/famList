"use client";

import { useTransition } from "react";
import { setListShare } from "../actions";

type OtherUser = { id: string; name: string };
type OwnedList = { id: string; title: string; shares: { userId: string }[] };

export function ListSharingSection({
  lists,
  otherUsers,
}: {
  lists: OwnedList[];
  otherUsers: OtherUser[];
}) {
  if (lists.length === 0) {
    return <p className="text-sm text-white/60">You don&apos;t own any lists yet.</p>;
  }
  if (otherUsers.length === 0) {
    return <p className="text-sm text-white/60">No other family members to share with yet.</p>;
  }

  return (
    <div className="space-y-3">
      {lists.map((list) => (
        <ListShareRow key={list.id} list={list} otherUsers={otherUsers} />
      ))}
    </div>
  );
}

function ListShareRow({ list, otherUsers }: { list: OwnedList; otherUsers: OtherUser[] }) {
  const [isPending, startTransition] = useTransition();
  const sharedWith = new Set(list.shares.map((share) => share.userId));

  return (
    <div className="rounded-lg border border-white/15 bg-card-background p-3">
      <p className="font-medium">{list.title}</p>
      <div className="mt-2 flex flex-wrap gap-4">
        {otherUsers.map((user) => (
          <label key={user.id} className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={sharedWith.has(user.id)}
              disabled={isPending}
              onChange={(e) => startTransition(() => setListShare(list.id, user.id, e.target.checked))}
              className="size-4"
            />
            {user.name}
          </label>
        ))}
      </div>
    </div>
  );
}
