"use client";

import { forwardRef, useTransition, type PointerEventHandler } from "react";
import { ChevronUp, ChevronDown, Clock, GripVertical, Trash2 } from "lucide-react";
import { toggleItem, deleteItem, moveItem, setItemRecurring } from "../actions";
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
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** Tapping the item's text space opens ItemEditForm for it (see ItemList). */
  onEdit: () => void;
  /** Mobile touch-and-drag (see ItemList) — omitted on desktop, where the chevrons above still do the job. */
  dragHandleProps?: DragHandleProps;
  isDragging?: boolean;
  dragOffset?: number;
};

export const ItemRow = forwardRef<HTMLLIElement, ItemRowProps>(function ItemRow(
  { listId, kind, item, canMoveUp, canMoveDown, onEdit, dragHandleProps, isDragging, dragOffset = 0 },
  ref,
) {
  const [isPending, startTransition] = useTransition();
  const { deleteMode } = useDeleteMode();
  const iconButtonClass =
    "text-black/40 hover:text-black/70 disabled:opacity-30 disabled:hover:text-black/40 dark:text-white/40 dark:hover:text-white/70 dark:disabled:hover:text-white/40";

  // Only shopping lists track "done" day-to-day — everywhere else, isDone
  // only matters while picking things to delete, so the checkbox stays
  // hidden the rest of the time (see LIST_KINDS in types.ts).
  const showCheckbox = kind === "shopping" || deleteMode;
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
                ListItem.isRecurring in schema.prisma). */}
            {kind === "shopping" && (
              <button
                onClick={() => startTransition(() => setItemRecurring(listId, item.id, !item.isRecurring))}
                disabled={isPending}
                aria-pressed={item.isRecurring}
                aria-label={item.isRecurring ? `Mark ${item.label} as a one-off item` : `Mark ${item.label} as recurring`}
                title={item.isRecurring ? "Recurring — resets when checked off" : "One-off — stays checked"}
                className={
                  item.isRecurring
                    ? `text-white/70 hover:text-white disabled:opacity-30`
                    : `text-black/25 hover:text-black/50 disabled:opacity-30 dark:text-white/25 dark:hover:text-white/50`
                }
              >
                <Clock className="size-4" strokeWidth={1.75} />
              </button>
            )}
            {/* Desktop/tablet: up/down chevrons. */}
            <div className="hidden items-center gap-2 md:flex">
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
            </div>
            {/* Mobile: press-and-drag handle. touch-none stops the page from
                scrolling under the finger once a drag starts, so pointermove
                drives the reorder instead of native scroll. */}
            <button
              type="button"
              aria-label={`Reorder ${item.label}`}
              title="Drag to reorder"
              className={`touch-none cursor-grab select-none px-4 active:cursor-grabbing md:hidden ${iconButtonClass}`}
              {...dragHandleProps}
            >
              <GripVertical className="size-4" strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>
    </li>
  );
});
