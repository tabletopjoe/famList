"use client";

import { useTransition } from "react";
import { toggleItem, deleteItem } from "../actions";

type ItemRowProps = {
  listId: string;
  item: {
    id: string;
    label: string;
    quantity: string | null;
    isDone: boolean;
  };
};

export function ItemRow({ listId, item }: ItemRowProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        checked={item.isDone}
        disabled={isPending}
        onChange={(e) => {
          const checked = e.target.checked;
          startTransition(() => {
            toggleItem(listId, item.id, checked);
          });
        }}
        className="size-4"
      />
      <span className={`flex-1 ${item.isDone ? "text-black/40 line-through dark:text-white/40" : ""}`}>
        {item.label}
        {item.quantity && <span className="text-black/50 dark:text-white/50"> · {item.quantity}</span>}
      </span>
      <button
        onClick={() => startTransition(() => deleteItem(listId, item.id))}
        disabled={isPending}
        className="text-sm text-black/40 hover:text-red-600 disabled:opacity-50"
        aria-label={`Delete ${item.label}`}
      >
        ✕
      </button>
    </li>
  );
}
