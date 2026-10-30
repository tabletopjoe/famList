"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { reorderItems } from "../actions";
import { useDragReorder } from "@/hooks/useDragReorder";
import { isChecklistKind, type ListKind } from "../types";
import { ItemEditForm } from "./ItemEditForm";
import { useItemEdit } from "./ItemEditContext";
import { DONE_GROUP_KEY, useItemSort } from "./ItemSortContext";
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
  startDate: Date | null;
  dueDate: Date | null;
  person: string | null;
  statusId: string | null;
  dependsOnId: string | null;
};

type Category = { id: string; name: string };
type Status = { id: string; name: string };
/** `subgroups`, when set, render nested inside the group instead of a flat `ids` list. */
type Group = { key: string; name: string; ids: string[]; subgroups?: Group[] };

export function ItemList({
  listId,
  items,
  kind,
  resetIntervalDays,
  categories,
  statuses,
}: {
  listId: string;
  items: Item[];
  kind: ListKind;
  resetIntervalDays: number | null;
  categories: Category[];
  statuses: Status[];
}) {
  const { editingId, setEditingId } = useItemEdit();
  const { itemSort: storedSort, categoryDir, checkedDir, isGroupCollapsed, toggleGroup } = useItemSort();
  // The Checked sort is shopping-only — a remembered "checked" on a list
  // that's since changed kind just shows the default order.
  const itemSort = storedSort === "checked" && kind !== "shopping" ? "custom" : storedSort;

  const itemsById = new Map(items.map((i) => [i.id, i]));
  const statusesById = new Map(statuses.map((st) => [st.id, st]));
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
  // Dragging only reorders ListItem.position within a flat list — the
  // grouped sorts (category, checked) lay items out differently, so hide
  // the handle there, same reasoning as ListCardList's non-custom sorts.
  const draggable = itemSort === "custom";

  // Checklist lists (shopping, project): checked-off items always move into
  // their own group at the bottom — collapsed unless opened, and remembered
  // per list — whatever the sort. Everything below groups only `activeIds`.
  const groupsDone = isChecklistKind(kind);
  const isDone = (id: string) => itemsById.get(id)?.isDone ?? false;
  const activeIds = groupsDone ? order.filter((id) => !isDone(id)) : order;
  const doneIds = groupsDone ? order.filter(isDone) : [];
  const doneGroup: Group = { key: DONE_GROUP_KEY, name: kind === "project" ? "Completed" : "Checked", ids: doneIds };

  function renderRow(id: string) {
    const item = itemsById.get(id);
    if (!item) return null;
    // Project lists only: the precursor this item is still waiting on (if
    // it isn't done yet), which locks the row — see ListItem.dependsOn.
    const precursor = item.dependsOnId ? itemsById.get(item.dependsOnId) : undefined;
    const project =
      kind === "project"
        ? {
            statusName: item.statusId ? (statusesById.get(item.statusId)?.name ?? null) : null,
            person: item.person,
            startDate: item.startDate,
            dueDate: item.dueDate,
            waitingOn: precursor && !precursor.isDone ? precursor.label : null,
          }
        : undefined;
    return (
      <ItemRow
        key={id}
        ref={(el) => registerRow(id, el)}
        listId={listId}
        item={item}
        kind={kind}
        project={project}
        // Checked-off recurrence set to "Never" (null) means nothing ever
        // resets, so the per-item recurring toggle would have no effect.
        showRecurring={kind === "shopping" && resetIntervalDays != null}
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
  // `keyPrefix` keeps the done group's category sub-groups' collapse state
  // separate from the main category groups of the same name.
  function groupByCategory(ids: string[], keyPrefix = ""): Group[] {
    const orderedCategories =
      categoryDir === "alpha" ? [...categories].sort((a, b) => a.name.localeCompare(b.name)) : categories;
    const groups = orderedCategories.map((c) => ({ id: c.id as string | null, name: c.name, ids: [] as string[] }));
    const groupById = new Map(groups.map((g) => [g.id, g]));
    const uncategorized: string[] = [];

    for (const id of ids) {
      const item = itemsById.get(id);
      const group = item?.categoryId ? groupById.get(item.categoryId) : undefined;
      if (group) group.ids.push(id);
      else uncategorized.push(id);
    }

    const result = groups
      .filter((g) => g.ids.length > 0)
      .map((g) => ({ key: `${keyPrefix}${g.id}`, name: g.name, ids: g.ids }));
    if (uncategorized.length > 0) {
      result.push({ key: `${keyPrefix}uncategorized`, name: "Uncategorized", ids: uncategorized });
    }
    return result;
  }

  // Shopping lists: unchecked vs. checked, in whichever order checkedDir
  // says. Items within each keep their existing relative order.
  function groupByChecked(): Group[] {
    const unchecked: Group = { key: "unchecked", name: "Unchecked", ids: activeIds };
    return checkedDir === "checked" ? [doneGroup, unchecked] : [unchecked, doneGroup];
  }

  // `flatIds` renders as a plain, header-less list above any `groups`.
  let flatIds: string[] = [];
  let groups: Group[] = [];
  if (editingId) flatIds = visibleIds;
  else if (itemSort === "category") {
    // Checked-off items stay grouped by category too, nested under the done group.
    groups = [...groupByCategory(activeIds), { ...doneGroup, subgroups: groupByCategory(doneIds, `${DONE_GROUP_KEY}:`) }];
  }
  else if (itemSort === "checked") groups = groupByChecked();
  else {
    flatIds = activeIds;
    groups = [doneGroup];
  }
  groups = groups.filter((g) => g.ids.length > 0);

  function renderGroup(group: Group, nested = false) {
    const key = group.key;
    const collapsed = isGroupCollapsed(key);
    const rows = <ul className="divide-y divide-foreground/10 dark:divide-foreground/15">{group.ids.map(renderRow)}</ul>;

    // Expanded category groups trade the header row for a vertical label
    // (reads top-to-bottom — upright with the device turned clockwise) in
    // the page's left padding, so a long list spends no lines on headers
    // and the rows don't shift right. The label sticks to the top of the
    // screen while its group scrolls past, and tapping it collapses the
    // group back to a normal header row. The label column also sets a
    // minimum height, so a one-item group still fits its whole name.
    if (itemSort === "category" && !group.subgroups && !collapsed) {
      return (
        <div key={key} className="flex border-t border-foreground/10 first:border-t-0 dark:border-foreground/15">
          <button
            type="button"
            onClick={() => toggleGroup(key)}
            aria-expanded
            aria-label={`Collapse ${group.name}`}
            title={`Collapse ${group.name}`}
            className="-ml-6 flex w-6 shrink-0 justify-center text-foreground/40 hover:text-foreground/70 active:opacity-60"
          >
            <span className="sticky top-2 self-start py-1.5 text-[10px] leading-none font-medium tracking-wide whitespace-nowrap uppercase [writing-mode:vertical-rl]">
              {group.name} <span className="text-foreground/30">({group.ids.length})</span>
            </span>
          </button>
          <div className="min-w-0 flex-1">{rows}</div>
        </div>
      );
    }

    return (
      <div key={key} className={nested ? "pl-3" : undefined}>
        <button
          type="button"
          onClick={() => toggleGroup(key)}
          aria-expanded={!collapsed}
          className="flex w-full items-center justify-between gap-2 py-0.5 text-left"
        >
          <span className="text-xs font-medium tracking-wide text-foreground/40 uppercase">
            {group.name} <span className="text-foreground/30">({group.ids.length})</span>
          </span>
          <ChevronDown
            className={`size-3.5 shrink-0 text-foreground/40 transition-transform ${collapsed ? "" : "rotate-180"}`}
            strokeWidth={1.75}
          />
        </button>
        {!collapsed &&
          (group.subgroups ? (
            <div className="space-y-0.5">{group.subgroups.map((sub) => renderGroup(sub, true))}</div>
          ) : (
            rows
          ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {flatIds.length > 0 && (
          <ul className="divide-y divide-foreground/10 dark:divide-foreground/15">{flatIds.map(renderRow)}</ul>
        )}
        {groups.map((group) => renderGroup(group))}
      </div>
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
              statuses={statuses}
              items={items}
              onCancel={() => setEditingId(null)}
              onSaved={() => setEditingId(null)}
            />
          );
        })()}
    </>
  );
}
