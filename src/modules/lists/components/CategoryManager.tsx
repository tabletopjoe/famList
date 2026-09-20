"use client";

import { useMemo, useState, useTransition } from "react";
import { Grip, Plus, Trash2 } from "lucide-react";
import { createCategory, deleteCategory, reorderCategories } from "../actions";
import { useDragReorder } from "@/hooks/useDragReorder";

type Category = { id: string; name: string };

/**
 * Add/delete/reorder for one list's categories — lives inside
 * ListSettingsMenu's "Categories" CollapsibleSection. Same press-and-drag
 * pattern as ItemList/ListCardList (see useDragReorder), just without a
 * group boundary (any category can trade places with any other).
 */
export function CategoryManager({ listId, categories }: { listId: string; categories: Category[] }) {
  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);

  const { order, draggingId, dragOffset, registerRow, dragHandlePropsFor } = useDragReorder<string, HTMLDivElement>(
    categoryIds,
    (order) => reorderCategories(listId, order),
  );

  const [, startDeleteTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addPending, startAddTransition] = useTransition();

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
        <p className="text-sm text-foreground/50">No categories yet.</p>
      ) : (
        <div className="space-y-1">
          {order.map((id) => {
            const category = categoriesById.get(id);
            if (!category) return null;
            const isDragging = draggingId === id;
            return (
              <div
                key={id}
                ref={(el) => registerRow(id, el)}
                style={
                  isDragging ? { transform: `translateY(${dragOffset}px)`, position: "relative", zIndex: 10 } : undefined
                }
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${isDragging ? "bg-foreground/10" : ""}`}
              >
                <span className="flex-1 truncate text-sm text-foreground">{category.name}</span>
                <button
                  type="button"
                  onClick={() => startDeleteTransition(() => deleteCategory(listId, id))}
                  aria-label={`Delete category ${category.name}`}
                  title="Delete category"
                  className="text-foreground/40 hover:text-red-400"
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label={`Reorder ${category.name}`}
                  title="Drag to reorder"
                  className="touch-none cursor-grab select-none px-1 text-foreground/40 hover:text-foreground/70 active:cursor-grabbing"
                  {...dragHandlePropsFor(id)}
                >
                  <Grip className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-foreground/10 pt-3">
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
          className="min-w-0 flex-1 rounded-md border border-black/15 bg-white/80 px-2 py-1.5 text-sm text-field-ink placeholder:text-field-ink/40 disabled:opacity-50"
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
