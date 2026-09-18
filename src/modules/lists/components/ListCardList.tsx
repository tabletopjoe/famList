"use client";

import { useMemo } from "react";
import { reorderLists } from "../actions";
import { useDragReorder } from "@/hooks/useDragReorder";
import { ListCard } from "./ListCard";

type ListSummary = {
  id: string;
  title: string;
  kind: string;
  _count: { items: number };
};

/**
 * Drag-reorder container for the lists index — same press-and-drag pattern
 * as ItemList (see useDragReorder), just without the isDone-style group
 * boundary: any visible list can trade places with any other.
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
  const listsById = new Map(lists.map((l) => [l.id, l]));
  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);

  const { order, draggingId, dragOffset, registerRow, dragHandlePropsFor } = useDragReorder<string, HTMLDivElement>(
    listIds,
    reorderLists,
  );

  return (
    <div className="space-y-3">
      {order.map((id) => {
        const list = listsById.get(id);
        if (!list) return null;
        const isPrimary = id === primaryListId;
        return (
          <ListCard
            key={id}
            ref={(el) => registerRow(id, el)}
            list={list}
            isPrimary={isPrimary}
            anyPrimary={anyPrimary}
            isDragging={draggingId === id}
            dragOffset={draggingId === id ? dragOffset : 0}
            dragHandleProps={draggable ? dragHandlePropsFor(id) : undefined}
          />
        );
      })}
    </div>
  );
}
