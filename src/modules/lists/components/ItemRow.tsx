"use client";

import { forwardRef, useTransition, type PointerEventHandler } from "react";
import { Clock, ExternalLink, Grip, Trash2 } from "lucide-react";
import { toggleItem, deleteItem, setItemRecurring } from "../actions";
import { useDeleteMode } from "./DeleteModeContext";
import type { ListKind } from "../types";
import { externalHref } from "../externalHref";

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
    link: string | null;
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
    "text-foreground/40 hover:text-foreground/70 active:text-foreground disabled:opacity-30 disabled:hover:text-foreground/40";

  // Only shopping lists use "done" at all — everywhere else the checkbox
  // stays hidden even in delete mode, where deleting is a direct tap on the
  // trash icon below, not a check-then-delete flow (see LIST_KINDS in
  // types.ts).
  const showCheckbox = kind === "shopping";
  // Recipe, notes, and collection items with a saved link get a launch icon
  // ahead of their text — a sibling of the edit button, so tapping it opens
  // the link rather than the edit form.
  const trimmedLink = item.link?.trim();
  const showLink = kind !== "shopping" && !!trimmedLink;
  const labelSpan = (
    <span className={`flex-1 ${item.isDone ? "text-foreground/40 line-through" : ""}`}>
      {item.label}
      {item.quantity && <span className="text-foreground/50"> · {item.quantity}</span>}
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
            // A named theme color (--color-accent, see globals.css), not an
            // arbitrary hex value — Tailwind only generates the safe
            // plain-color fallback (for browsers without the oklab() color
            // function) for named colors, not one-off bracket values.
            className="size-4 shrink-0 accent-accent/85"
          />
        )}
        {showLink && (
          <a
            href={externalHref(trimmedLink!)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open link for ${item.label}`}
            title="Open link"
            className="shrink-0 text-foreground/50 transition-colors hover:text-foreground active:text-foreground"
          >
            <ExternalLink className="size-4" strokeWidth={1.75} />
          </a>
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
            className="text-red-500 hover:text-red-600 active:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300 dark:active:text-red-200"
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
                className={`relative active:opacity-60 ${
                  item.isRecurring
                    ? "text-foreground/70 hover:text-foreground disabled:opacity-30"
                    : "text-foreground/25 hover:text-foreground/50 disabled:opacity-30"
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
            {/* Press-and-drag handle — the only reorder control now, on every
                breakpoint. Omitted when the list is sorted by category
                (see ItemList), since dragging wouldn't have any visible
                effect there. */}
            {dragHandleProps && (
              <button
                type="button"
                aria-label={`Reorder ${item.label}`}
                title="Drag to reorder"
                className={`touch-none cursor-grab select-none px-4 active:cursor-grabbing ${iconButtonClass}`}
                {...dragHandleProps}
              >
                <Grip className="size-4" strokeWidth={1.75} />
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
});
