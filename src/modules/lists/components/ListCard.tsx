"use client";

import Link from "next/link";
import { forwardRef, useTransition, type PointerEventHandler } from "react";
import { CheckSquare, Square, GripVertical } from "lucide-react";
import { setPrimaryList } from "../actions";

type DragHandleProps = {
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
};

type ListCardProps = {
  list: {
    id: string;
    title: string;
    kind: string;
    _count: { items: number };
  };
  /** Whether this list is the *viewing user's* primary — a personal preference, not a property of the list. */
  isPrimary: boolean;
  /** Whether the viewing user has ANY primary list set — governs whether non-primary rows show an empty toggle. */
  anyPrimary: boolean;
  /** Press-and-drag reordering (see ListCardList). */
  dragHandleProps?: DragHandleProps;
  isDragging?: boolean;
  dragOffset?: number;
};

export const ListCard = forwardRef<HTMLDivElement, ListCardProps>(function ListCard(
  { list, isPrimary, anyPrimary, dragHandleProps, isDragging, dragOffset = 0 },
  ref,
) {
  const [isPending, startTransition] = useTransition();
  // Show the toggle on this row if it's the primary list, or if no list is
  // primary yet (in which case every row shows an empty box to pick from).
  const showPrimaryToggle = isPrimary || !anyPrimary;

  return (
    <div
      ref={ref}
      style={isDragging ? { transform: `translateY(${dragOffset}px)`, position: "relative", zIndex: 10 } : undefined}
      className={`flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-card-background p-4 ${isDragging ? "shadow-xl" : ""}`}
    >
      <Link href={`/lists/${list.id}`} className="flex-1">
        <p className="font-medium">{list.title}</p>
        <p className="text-sm text-white/60">
          {list._count.items} item{list._count.items === 1 ? "" : "s"}
        </p>
      </Link>
      <div className="flex items-center gap-3">
        {showPrimaryToggle && (
          <button
            onClick={() => startTransition(() => setPrimaryList(list.id, !isPrimary))}
            disabled={isPending}
            aria-label={isPrimary ? `Unset ${list.title} as the primary list` : `Set ${list.title} as the primary list`}
            title={isPrimary ? "Primary list" : "Set as primary list"}
            className={`disabled:opacity-50 ${isPrimary ? "text-white" : "text-white/40 hover:text-white"}`}
          >
            {isPrimary ? (
              <CheckSquare className="size-5" strokeWidth={1.75} />
            ) : (
              <Square className="size-5" strokeWidth={1.75} />
            )}
          </button>
        )}
        {/* Rightmost: press-and-drag handle, same touch-reorder pattern as
            ItemRow — hidden when a non-custom sort is active (see
            ListCardList), since dragging wouldn't have any visible effect. */}
        {dragHandleProps && (
          <button
            type="button"
            aria-label={`Reorder ${list.title}`}
            title="Drag to reorder"
            className="touch-none cursor-grab select-none px-2 text-white/40 hover:text-white/70 active:cursor-grabbing disabled:opacity-30"
            {...dragHandleProps}
          >
            <GripVertical className="size-5" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
});
