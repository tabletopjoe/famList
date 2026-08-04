"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteList } from "../actions";

type ListCardProps = {
  list: {
    id: string;
    title: string;
    kind: string;
    _count: { items: number };
  };
};

export function ListCard({ list }: ListCardProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15">
      <Link href={`/lists/${list.id}`} className="flex-1">
        <p className="font-medium">{list.title}</p>
        <p className="text-sm text-black/60 dark:text-white/60">
          {list._count.items} item{list._count.items === 1 ? "" : "s"}
        </p>
      </Link>
      <button
        onClick={() => {
          if (confirm(`Delete "${list.title}"? This can't be undone.`)) {
            startTransition(() => deleteList(list.id));
          }
        }}
        disabled={isPending}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
