import { isChecklistKind, type ListKind } from "./types";
import { DONE_GROUP_KEY, type ItemSort } from "./components/ItemSortContext";

type GroupableItem = { isDone: boolean; categoryId: string | null };

/** A collapsible ItemList group; `parent` is set for the done group's category sub-groups. */
export type GroupKey = { key: string; parent?: string };

/**
 * The collapsible groups ItemList will render for these items — keys only,
 * in no particular order. Membership doesn't depend on drag order, so
 * ListControls can derive the same set ItemList renders (for its
 * expand-all / collapse-all buttons) without ItemList reporting it back.
 * Keep in step with ItemList's grouping.
 */
export function collapsibleGroupKeys(
  items: GroupableItem[],
  kind: ListKind,
  itemSort: ItemSort,
  categories: { id: string }[],
): GroupKey[] {
  // Same fallback as ItemList: the Checked sort is shopping-only.
  const sort = itemSort === "checked" && kind !== "shopping" ? "custom" : itemSort;
  const groupsDone = isChecklistKind(kind);
  const active = groupsDone ? items.filter((i) => !i.isDone) : items;
  const done = groupsDone ? items.filter((i) => i.isDone) : [];

  const categoryIds = new Set(categories.map((c) => c.id));
  const categoryKeys = (list: GroupableItem[], prefix: string) => [
    ...new Set(list.map((i) => `${prefix}${i.categoryId && categoryIds.has(i.categoryId) ? i.categoryId : "uncategorized"}`)),
  ];

  const keys: GroupKey[] = [];
  if (sort === "category") {
    keys.push(...categoryKeys(active, "").map((key) => ({ key })));
    if (done.length > 0) {
      keys.push({ key: DONE_GROUP_KEY });
      keys.push(...categoryKeys(done, `${DONE_GROUP_KEY}:`).map((key) => ({ key, parent: DONE_GROUP_KEY })));
    }
  } else {
    if (sort === "checked" && active.length > 0) keys.push({ key: "unchecked" });
    if (done.length > 0) keys.push({ key: DONE_GROUP_KEY });
  }
  return keys;
}
