"use client";

import { forwardRef, useTransition, type PointerEventHandler, type ReactNode } from "react";
import { Clock, ExternalLink, Grip, Lock, Trash2 } from "lucide-react";
import { toggleItem, deleteItem, setItemRecurring } from "../actions";
import { useDeleteMode } from "./DeleteModeContext";
import { isChecklistKind, type ListKind } from "../types";
import { externalHref } from "../externalHref";
import { formatDay, isPastDue } from "../dates";

type DragHandleProps = {
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
};

/** Project-list extras, pre-resolved by ItemList (status name, precursor label). */
type ProjectInfo = {
  statusName: string | null;
  person: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  /** Label of the unfinished item this one depends on — non-null means the row is locked. */
  waitingOn: string | null;
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
  project?: ProjectInfo;
  /** Tapping the item's text space opens ItemEditForm for it (see ItemList). */
  onEdit: () => void;
  /** Press-and-drag reordering (see ItemList) — the only way to reorder now, on every breakpoint. */
  dragHandleProps?: DragHandleProps;
  isDragging?: boolean;
  dragOffset?: number;
};

export const ItemRow = forwardRef<HTMLLIElement, ItemRowProps>(function ItemRow(
  { listId, kind, item, project, onEdit, dragHandleProps, isDragging, dragOffset = 0 },
  ref,
) {
  const [isPending, startTransition] = useTransition();
  const { deleteMode } = useDeleteMode();
  const iconButtonClass =
    "text-foreground/40 hover:text-foreground/70 active:text-foreground disabled:opacity-30 disabled:hover:text-foreground/40";

  // Only checklist kinds (shopping, project) use "done" at all — everywhere
  // else the checkbox stays hidden even in delete mode, where deleting is a
  // direct tap on the trash icon below, not a check-then-delete flow (see
  // LIST_KINDS in types.ts).
  const showCheckbox = isChecklistKind(kind);
  // A project item waiting on an unfinished precursor can't be checked off
  // (toggleItem refuses it server-side too). Already-done items aren't
  // locked — there's nothing left to block.
  const locked = !!project?.waitingOn && !item.isDone;
  // Recipe, notes, and collection items with a saved link get a launch icon
  // ahead of their text — a sibling of the edit button, so tapping it opens
  // the link rather than the edit form.
  const trimmedLink = item.link?.trim();
  const showLink = kind !== "shopping" && !!trimmedLink;
  const labelSpan = (
    <span className={`flex-1 ${item.isDone ? "text-foreground/40 line-through" : locked ? "text-foreground/50" : ""}`}>
      {item.label}
      {item.quantity && <span className="text-foreground/50"> · {item.quantity}</span>}
    </span>
  );
  const projectMeta = project && (() => {
    const parts: ReactNode[] = [];
    if (project.statusName) parts.push(<span key="status">{project.statusName}</span>);
    if (project.person) parts.push(<span key="person">{project.person}</span>);
    if (project.startDate && !project.dueDate) parts.push(<span key="start">Starts {formatDay(project.startDate)}</span>);
    if (project.dueDate) {
      const overdue = !item.isDone && isPastDue(project.dueDate);
      parts.push(
        // "Overdue" depends on the viewer's local date, which the server
        // can't know — let the client's answer win without a warning.
        <span key="due" suppressHydrationWarning className={overdue ? "text-red-500 dark:text-red-400" : undefined}>
          {project.startDate ? `${formatDay(project.startDate)} – ` : "Due "}
          {formatDay(project.dueDate)}
        </span>,
      );
    }
    if (locked) {
      parts.push(
        <span key="waiting" className="inline-flex items-center gap-1">
          <Lock className="size-3" strokeWidth={2} aria-hidden />
          Waiting on {project.waitingOn}
        </span>,
      );
    }
    if (parts.length === 0) return null;
    return (
      <span className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-foreground/50">
        {parts.flatMap((part, i) => (i === 0 ? [part] : [<span key={`sep${i}`} aria-hidden>·</span>, part]))}
      </span>
    );
  })();

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
            disabled={isPending || locked}
            title={locked ? `Waiting on ${project?.waitingOn}` : undefined}
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
            className="size-4 shrink-0 accent-accent/85 disabled:opacity-40"
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
        <button type="button" onClick={onEdit} className="flex flex-1 cursor-pointer flex-col py-1 text-left">
          {labelSpan}
          {projectMeta}
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
