"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { reorderItems } from "../actions";
import { useDragReorder } from "@/hooks/useDragReorder";
import type { ListKind } from "../types";
import { ItemEditForm } from "./ItemEditForm";
import { useItemEdit } from "./ItemEditContext";
import { useItemSort } from "./ItemSortContext";
import { ItemRow } from "./ItemRow";

type Item = {
  id: string;
  label: string;
  quantity: string | null;
  notes: string | null;
  link: string | null;
  isDone: boolean;
  isRecurring: boolean;
  categoryId: string | null;
};

type Category = { id: string; name: string };

export function ItemList({
  listId,
  items,
  kind,
  categories,
}: {
  listId: string;
  items: Item[];
  kind: ListKind;
  categories: Category[];
}) {
  const { editingId, setEditingId } = useItemEdit();
  const { itemSort, categoryDir } = useItemSort();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const itemsById = new Map(items.map((i) => [i.id, i]));
  // Only re-derived (and thus only re-synced into the hook's order state)
  // when `items` itself changes reference — see useDragReorder's own note
  // on why that matters for not clobbering an in-progress drag.
  const itemIds = useMemo(() => items.map((i) => i.id), [items]);

  const { order, draggingId, dragOffset, registerRow, dragHandlePropsFor } = useDragReorder<string, HTMLLIElement>(
    itemIds,
    (order) => reorderItems(listId, order),
    (id) => itemsById.get(id)?.isDone ?? false,
  );

  // While editing, the list collapses down to just that one row (at the
  // top) with the edit form beneath it — everything else stays hidden
  // until Save or Cancel closes it.
  const visibleIds = editingId ? order.filter((id) => id === editingId) : order;
  // Dragging only reorders ListItem.position, which the category sort
  // doesn't display by — hide the handle there, same reasoning as
  // ListCardList's non-custom sorts.
  const draggable = itemSort === "custom";

  function renderRow(id: string) {
    const item = itemsById.get(id);
    if (!item) return null;
    return (
      <ItemRow
        key={id}
        ref={(el) => registerRow(id, el)}
        listId={listId}
        item={item}
        kind={kind}
        onEdit={() => setEditingId(id)}
        isDragging={draggingId === id}
        dragOffset={draggingId === id ? dragOffset : 0}
        dragHandleProps={draggable ? dragHandlePropsFor(id) : undefined}
      />
    );
  }

  // Groups items under their category (in the category's own drag order, or
  // alphabetically — see ItemSortContext), uncategorized items last. Items
  // within a group keep their existing relative order.
  function groupByCategory() {
    const orderedCategories =
      categoryDir === "alpha" ? [...categories].sort((a, b) => a.name.localeCompare(b.name)) : categories;
    const groups = orderedCategories.map((c) => ({ id: c.id as string | null, name: c.name, ids: [] as string[] }));
    const groupById = new Map(groups.map((g) => [g.id, g]));
    const uncategorized: string[] = [];

    for (const id of order) {
      const item = itemsById.get(id);
      const group = item?.categoryId ? groupById.get(item.categoryId) : undefined;
      if (group) group.ids.push(id);
      else uncategorized.push(id);
    }

    const result = groups.filter((g) => g.ids.length > 0);
    if (uncategorized.length > 0) result.push({ id: null, name: "Uncategorized", ids: uncategorized });
    return result;
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <>
      {!editingId && itemSort === "category" ? (
        <div className="space-y-3">
          {groupByCategory().map((group) => {
            const key = group.id ?? "uncategorized";
            const collapsed = collapsedGroups.has(key);
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => toggleGroup(key)}
                  aria-expanded={!collapsed}
                  className="flex w-full items-center justify-between gap-2 py-1 text-left"
                >
                  <span className="text-xs font-medium tracking-wide text-white/40 uppercase">
                    {group.name} <span className="text-white/30">({group.ids.length})</span>
                  </span>
                  <ChevronDown
                    className={`size-3.5 shrink-0 text-white/40 transition-transform ${collapsed ? "" : "rotate-180"}`}
                    strokeWidth={1.75}
                  />
                </button>
                {!collapsed && (
                  <ul className="divide-y divide-black/10 dark:divide-white/15">{group.ids.map(renderRow)}</ul>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="divide-y divide-black/10 dark:divide-white/15">{visibleIds.map(renderRow)}</ul>
      )}
      {editingId &&
        (() => {
          const item = itemsById.get(editingId);
          if (!item) return null;
          return (
            <ItemEditForm
              listId={listId}
              kind={kind}
              item={item}
              categories={categories}
              onCancel={() => setEditingId(null)}
              onSaved={() => setEditingId(null)}
            />
          );
        })()}
    </>
  );
}
