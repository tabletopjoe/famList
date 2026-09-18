"use client";

import { useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";
import { reorderItems } from "../actions";
import type { ListKind } from "../types";
import { ItemEditForm } from "./ItemEditForm";
import { useItemEdit } from "./ItemEditContext";
import { ItemRow } from "./ItemRow";

type Item = {
  id: string;
  label: string;
  quantity: string | null;
  notes: string | null;
  link: string | null;
  isDone: boolean;
  isRecurring: boolean;
};

type DragState = {
  id: string;
  startY: number;
  /** Index bounds of the isDone group the drag started in — a drag can't cross out of it. */
  groupStart: number;
  groupEnd: number;
};

export function ItemList({ listId, items, kind }: { listId: string; items: Item[]; kind: ListKind }) {
  const [order, setOrder] = useState(() => items.map((i) => i.id));
  // Re-sync to the server's order whenever the `items` prop changes
  // underneath us (a toggle, a delete, someone else editing the list) —
  // drag-in-progress state is local and short-lived enough that clobbering
  // it here is fine. Adjusted during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-when-a-prop-changes.
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setOrder(items.map((i) => i.id));
  }

  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const { editingId, setEditingId } = useItemEdit();
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const drag = useRef<DragState | null>(null);

  const itemsById = new Map(items.map((i) => [i.id, i]));

  function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>, id: string) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const idx = order.indexOf(id);
    const isDone = itemsById.get(id)?.isDone ?? false;
    let groupStart = idx;
    let groupEnd = idx;
    while (groupStart > 0 && (itemsById.get(order[groupStart - 1])?.isDone ?? false) === isDone) groupStart--;
    while (groupEnd < order.length - 1 && (itemsById.get(order[groupEnd + 1])?.isDone ?? false) === isDone) groupEnd++;

    drag.current = { id, startY: e.clientY, groupStart, groupEnd };
    setDraggingId(id);
    setDragOffset(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state) return;
    setDragOffset(e.clientY - state.startY);

    const currentIdx = order.indexOf(state.id);
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
      reorderItems(listId, order);
    });
  }

  // While editing, the list collapses down to just that one row (at the
  // top) with the edit form beneath it — everything else stays hidden
  // until Save or Cancel closes it.
  const visibleIds = editingId ? order.filter((id) => id === editingId) : order;

  return (
    <>
      <ul className="divide-y divide-black/10 dark:divide-white/15">
        {visibleIds.map((id) => {
          const item = itemsById.get(id);
          if (!item) return null;
          return (
            <ItemRow
              key={id}
              ref={(el) => {
                if (el) rowRefs.current.set(id, el);
                else rowRefs.current.delete(id);
              }}
              listId={listId}
              item={item}
              kind={kind}
              onEdit={() => setEditingId(id)}
              isDragging={draggingId === id}
              dragOffset={draggingId === id ? dragOffset : 0}
              dragHandleProps={{
                onPointerDown: (e) => handlePointerDown(e, id),
                onPointerMove: handlePointerMove,
                onPointerUp: endDrag,
                onPointerCancel: endDrag,
              }}
            />
          );
        })}
      </ul>
      {editingId &&
        (() => {
          const item = itemsById.get(editingId);
          if (!item) return null;
          return (
            <ItemEditForm
              listId={listId}
              kind={kind}
              item={item}
              onCancel={() => setEditingId(null)}
              onSaved={() => setEditingId(null)}
            />
          );
        })()}
    </>
  );
}
