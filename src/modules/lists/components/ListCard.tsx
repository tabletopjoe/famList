"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Trash2, CheckSquare, Square } from "lucide-react";
import { deleteList, setPrimaryList } from "../actions";

type ListCardProps = {
  list: {
    id: string;
    title: string;
    kind: string;
    isPrimary: boolean;
    _count: { items: number };
  };
  /** Whether ANY list is currently primary — governs whether non-primary rows show an empty toggle. */
  anyPrimary: boolean;
};

export function ListCard({ list, anyPrimary }: ListCardProps) {
  const [isPending, startTransition] = useTransition();
  // Show the toggle on this row if it's the primary list, or if no list is
  // primary yet (in which case every row shows an empty box to pick from).
  const showPrimaryToggle = list.isPrimary || !anyPrimary;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-card-background p-4">
      <Link href={`/lists/${list.id}`} className="flex-1">
        <p className="font-medium">{list.title}</p>
        <p className="text-sm text-white/60">
          {list._count.items} item{list._count.items === 1 ? "" : "s"}
        </p>
      </Link>
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (confirm(`Delete "${list.title}"? This can't be undone.`)) {
              startTransition(() => deleteList(list.id));
            }
          }}
          disabled={isPending}
          aria-label={`Delete ${list.title}`}
          title="Delete list"
          className="text-white/40 hover:text-red-400 disabled:opacity-50"
        >
          <Trash2 className="size-5" strokeWidth={1.75} />
        </button>
        {showPrimaryToggle && (
          <button
            onClick={() => startTransition(() => setPrimaryList(list.id, !list.isPrimary))}
            disabled={isPending}
            aria-label={list.isPrimary ? `Unset ${list.title} as the primary list` : `Set ${list.title} as the primary list`}
            title={list.isPrimary ? "Primary list" : "Set as primary list"}
            className={`disabled:opacity-50 ${list.isPrimary ? "text-white" : "text-white/40 hover:text-white"}`}
          >
            {list.isPrimary ? (
              <CheckSquare className="size-5" strokeWidth={1.75} />
            ) : (
              <Square className="size-5" strokeWidth={1.75} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
