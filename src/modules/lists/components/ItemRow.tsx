"use client";

import { forwardRef, useTransition, type PointerEventHandler } from "react";
import { Clock, Grip, Trash2 } from "lucide-react";
import { toggleItem, deleteItem, setItemRecurring } from "../actions";
import { useDeleteMode } from "./DeleteModeContext";
import type { ListKind } from "../types";

type DragHandleProps = {
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
};

type ItemRowProps = {
  listId: string;
  kind: ListKind;
  item: {
    id: string;
    label: string;
    quantity: string | null;
    isDone: boolean;
    isRecurring: boolean;
  };
  /** Tapping the item's text space opens ItemEditForm for it (see ItemList). */
  onEdit: () => void;
  /** Press-and-drag reordering (see ItemList) — the only way to reorder now, on every breakpoint. */
  dragHandleProps?: DragHandleProps;
  isDragging?: boolean;
  dragOffset?: number;
};

export const ItemRow = forwardRef<HTMLLIElement, ItemRowProps>(function ItemRow(
  { listId, kind, item, onEdit, dragHandleProps, isDragging, dragOffset = 0 },
  ref,
) {
  const [isPending, startTransition] = useTransition();
  const { deleteMode } = useDeleteMode();
  const iconButtonClass =
    "text-black/40 hover:text-black/70 disabled:opacity-30 disabled:hover:text-black/40 dark:text-white/40 dark:hover:text-white/70 dark:disabled:hover:text-white/40";

  // Only shopping lists use "done" at all — everywhere else the checkbox
  // stays hidden even in delete mode, where deleting is a direct tap on the
  // trash icon below, not a check-then-delete flow (see LIST_KINDS in
  // types.ts).
  const showCheckbox = kind === "shopping";
  const labelSpan = (
    <span className={`flex-1 ${item.isDone ? "text-black/40 line-through dark:text-white/40" : ""}`}>
      {item.label}
      {item.quantity && <span className="text-black/50 dark:text-white/50"> · {item.quantity}</span>}
    </span>
  );

  return (
    <li
      ref={ref}
      style={isDragging ? { transform: `translateY(${dragOffset}px)`, position: "relative", zIndex: 10 } : undefined}
      className={`flex items-center gap-3 py-2 ${isDragging ? "bg-card-background" : ""}`}
    >
      <div className="flex flex-1 items-center gap-3">
        {showCheckbox && (
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
            className="size-4 shrink-0 accent-[#F4A261]/85"
          />
        )}
        {/* The text space between the checkbox and the icon group opens the edit form. */}
        <button type="button" onClick={onEdit} className="flex flex-1 cursor-pointer items-center py-1 text-left">
          {labelSpan}
        </button>
      </div>
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
            {/* Shopping lists only: recurring vs. one-off — governs whether
                checking this off auto-resets it later (see
                ListItem.isRecurring in schema.prisma). Crossed out (in
                addition to the fade) when it's a one-off. */}
            {kind === "shopping" && (
              <button
                onClick={() => startTransition(() => setItemRecurring(listId, item.id, !item.isRecurring))}
                disabled={isPending}
                aria-pressed={item.isRecurring}
                aria-label={item.isRecurring ? `Mark ${item.label} as a one-off item` : `Mark ${item.label} as recurring`}
                title={item.isRecurring ? "Recurring — resets when checked off" : "One-off — stays checked"}
                className={`relative ${
                  item.isRecurring
                    ? "text-white/70 hover:text-white disabled:opacity-30"
                    : "text-black/25 hover:text-black/50 disabled:opacity-30 dark:text-white/25 dark:hover:text-white/50"
                }`}
              >
                <Clock className="size-4" strokeWidth={1.75} />
                {!item.isRecurring && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="h-[1.5px] w-[18px] rotate-45 bg-current" />
                  </span>
                )}
              </button>
            )}
            {/* Press-and-drag handle — the only reorder control now, on every breakpoint. */}
            <button
              type="button"
              aria-label={`Reorder ${item.label}`}
              title="Drag to reorder"
              className={`touch-none cursor-grab select-none px-4 active:cursor-grabbing ${iconButtonClass}`}
              {...dragHandleProps}
            >
              <Grip className="size-4" strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>
    </li>
  );
});
