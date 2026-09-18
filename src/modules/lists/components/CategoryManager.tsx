"use client";

import { useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";
import { Grip, Plus, Trash2 } from "lucide-react";
import { createCategory, deleteCategory, reorderCategories } from "../actions";

type Category = { id: string; name: string };

type DragState = { id: string; startY: number };

/**
 * Add/delete/reorder for one list's categories — lives inside
 * ListSettingsMenu's "Categories" CollapsibleSection. Same press-and-drag
 * pattern as ItemList/ListCardList, just without a group boundary (any
 * category can trade places with any other).
 */
export function CategoryManager({ listId, categories }: { listId: string; categories: Category[] }) {
  const [order, setOrder] = useState(() => categories.map((c) => c.id));
  const [prevCategories, setPrevCategories] = useState(categories);
  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setOrder(categories.map((c) => c.id));
  }
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const drag = useRef<DragState | null>(null);

  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addPending, startAddTransition] = useTransition();

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
      reorderCategories(listId, order);
    });
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    startAddTransition(async () => {
      const result = await createCategory(listId, name);
      if ("error" in result) {
        setError(result.error);
      } else {
        setError(null);
        setNewName("");
      }
    });
  }

  return (
    <div className="space-y-3">
      {order.length === 0 ? (
        <p className="text-sm text-white/50">No categories yet.</p>
      ) : (
        <div className="space-y-1">
          {order.map((id) => {
            const category = categoriesById.get(id);
            if (!category) return null;
            const isDragging = draggingId === id;
            return (
              <div
                key={id}
                ref={(el) => {
                  if (el) rowRefs.current.set(id, el);
                  else rowRefs.current.delete(id);
                }}
                style={
                  isDragging ? { transform: `translateY(${dragOffset}px)`, position: "relative", zIndex: 10 } : undefined
                }
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${isDragging ? "bg-white/10" : ""}`}
              >
                <span className="flex-1 truncate text-sm text-white">{category.name}</span>
                <button
                  type="button"
                  onClick={() => startTransition(() => deleteCategory(listId, id))}
                  aria-label={`Delete category ${category.name}`}
                  title="Delete category"
                  className="text-white/40 hover:text-red-400"
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label={`Reorder ${category.name}`}
                  title="Drag to reorder"
                  className="touch-none cursor-grab select-none px-1 text-white/40 hover:text-white/70 active:cursor-grabbing"
                  onPointerDown={(e) => handlePointerDown(e, id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <Grip className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-white/10 pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="New category"
          disabled={addPending}
          className="min-w-0 flex-1 rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-background placeholder:text-background/40 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={addPending}
          aria-label="Add category"
          title="Add category"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background disabled:opacity-50"
        >
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
