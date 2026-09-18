"use client";

import { useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";

export type DragHandleProps = {
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
};

type DragState = {
  id: string;
  startY: number;
  /** Index bounds of the group the drag started in — a drag can't cross out of it. Spans the whole list when there's no `groupKey`. */
  groupStart: number;
  groupEnd: number;
};

/**
 * Press-and-drag reordering shared by ItemList, ListCardList, and
 * CategoryManager: tracks a local `order` (synced from `ids` whenever the
 * server data changes), reports the dropped order via `onReorder`, and
 * reorders live as the pointer crosses a neighboring row's midpoint.
 *
 * `groupKey`, when given, confines a drag to the contiguous run of ids
 * sharing the dragged id's key (e.g. ItemList's isDone) — without it, any
 * id can trade places with any other.
 *
 * `ids` is only re-synced into local order state when its *reference*
 * changes, so callers deriving it from a longer-lived prop (e.g.
 * `items.map(i => i.id)`) must memoize it — otherwise a fresh array on
 * every render would look like new server data and reset any in-progress
 * drag.
 */
export function useDragReorder<Id extends string, El extends HTMLElement>(
  ids: Id[],
  onReorder: (order: Id[]) => void,
  groupKey?: (id: Id) => unknown,
) {
  const [order, setOrder] = useState(ids);
  // Adjusted during render (rather than in an effect) whenever `ids` changes
  // underneath us — see https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-when-a-prop-changes.
  const [prevIds, setPrevIds] = useState(ids);
  if (ids !== prevIds) {
    setPrevIds(ids);
    setOrder(ids);
  }

  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<Id | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const rowRefs = useRef(new Map<Id, El>());
  const drag = useRef<DragState | null>(null);

  function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>, id: Id) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const idx = order.indexOf(id);
    let groupStart = 0;
    let groupEnd = order.length - 1;
    if (groupKey) {
      const key = groupKey(id);
      groupStart = idx;
      groupEnd = idx;
      while (groupStart > 0 && groupKey(order[groupStart - 1]) === key) groupStart--;
      while (groupEnd < order.length - 1 && groupKey(order[groupEnd + 1]) === key) groupEnd++;
    }

    drag.current = { id, startY: e.clientY, groupStart, groupEnd };
    setDraggingId(id);
    setDragOffset(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state) return;
    setDragOffset(e.clientY - state.startY);

    const currentIdx = order.indexOf(state.id as Id);
    for (let i = state.groupStart; i <= state.groupEnd; i++) {
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
        next.splice(i, 0, state.id as Id);
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
    startTransition(() => onReorder(order));
  }

  function registerRow(id: Id, el: El | null) {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  }

  function dragHandlePropsFor(id: Id): DragHandleProps {
    return {
      onPointerDown: (e) => handlePointerDown(e, id),
      onPointerMove: handlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    };
  }

  return { order, draggingId, dragOffset, registerRow, dragHandlePropsFor };
}
