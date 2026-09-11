"use client";

import { useTransition } from "react";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { toggleItem, deleteItem, moveItem } from "../actions";
import { useDeleteMode } from "./DeleteModeContext";

type ItemRowProps = {
  listId: string;
  item: {
    id: string;
    label: string;
    quantity: string | null;
    isDone: boolean;
  };
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export function ItemRow({ listId, item, canMoveUp, canMoveDown }: ItemRowProps) {
  const [isPending, startTransition] = useTransition();
  const { deleteMode } = useDeleteMode();
  const iconButtonClass =
    "text-black/40 hover:text-black/70 disabled:opacity-30 disabled:hover:text-black/40 dark:text-white/40 dark:hover:text-white/70 dark:disabled:hover:text-white/40";

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
      <div className="flex items-center gap-2">
        {deleteMode ? (
          <button
            onClick={() => startTransition(() => deleteItem(listId, item.id))}
            disabled={isPending}
            aria-label={`Delete ${item.label}`}
            title="Delete item"
            className="text-red-500 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="size-4" strokeWidth={1.75} />
          </button>
        ) : (
          <>
            <button
              onClick={() => startTransition(() => moveItem(listId, item.id, "up"))}
              disabled={isPending || !canMoveUp}
              aria-label={`Move ${item.label} up`}
              title="Move up"
              className={iconButtonClass}
            >
              <ChevronUp className="size-4" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => startTransition(() => moveItem(listId, item.id, "down"))}
              disabled={isPending || !canMoveDown}
              aria-label={`Move ${item.label} down`}
              title="Move down"
              className={iconButtonClass}
            >
              <ChevronDown className="size-4" strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
