"use client";

import { useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";
import { reorderLists } from "../actions";
import { ListCard } from "./ListCard";

type ListSummary = {
  id: string;
  title: string;
  kind: string;
  _count: { items: number };
};

type DragState = {
  id: string;
  startY: number;
};

/**
 * Drag-reorder container for the lists index — same press-and-drag pattern
 * as ItemList (see that component for the algorithm notes), just without
 * the isDone-style group boundary: any visible list can trade places with
 * any other.
 */
export function ListCardList({
  lists,
  primaryListId,
  anyPrimary,
  draggable,
}: {
  lists: ListSummary[];
  primaryListId: string | null;
  anyPrimary: boolean;
  /** Dragging only reorders List.position, which only the "custom" sort mode actually displays by — hide the handle otherwise. */
  draggable: boolean;
}) {
  const [order, setOrder] = useState(() => lists.map((l) => l.id));
  const [prevLists, setPrevLists] = useState(lists);
  if (lists !== prevLists) {
    setPrevLists(lists);
    setOrder(lists.map((l) => l.id));
  }

  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const drag = useRef<DragState | null>(null);

  const listsById = new Map(lists.map((l) => [l.id, l]));

  function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>, id: string) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id, startY: e.clientY };
    setDraggingId(id);
    setDragOffset(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state) return;
    setDragOffset(e.clientY - state.startY);

    const currentIdx = order.indexOf(state.id);
    for (let i = 0; i < order.length; i++) {
      if (i === currentIdx) continue;
      const el = rowRefs.current.get(order[i]);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const movingDown = i > currentIdx;
      const crossed = movingDown ? e.clientY > midpoint : e.clientY < midpoint;
      if (crossed) {
        const next = order.slice();
        next.splice(currentIdx, 1);
        next.splice(i, 0, state.id);
        setOrder(next);
        state.startY = e.clientY;
        setDragOffset(0);
        break;
      }
    }
  }

  function endDrag() {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    setDraggingId(null);
    setDragOffset(0);
    startTransition(() => {
      reorderLists(order);
    });
  }

  return (
    <div className="space-y-3">
      {order.map((id) => {
        const list = listsById.get(id);
        if (!list) return null;
        const isPrimary = id === primaryListId;
        return (
          <ListCard
            key={id}
            ref={(el) => {
              if (el) rowRefs.current.set(id, el);
              else rowRefs.current.delete(id);
            }}
            list={list}
            isPrimary={isPrimary}
            anyPrimary={anyPrimary}
            isDragging={draggingId === id}
            dragOffset={draggingId === id ? dragOffset : 0}
            dragHandleProps={
              draggable
                ? {
                    onPointerDown: (e) => handlePointerDown(e, id),
                    onPointerMove: handlePointerMove,
                    onPointerUp: endDrag,
                    onPointerCancel: endDrag,
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
