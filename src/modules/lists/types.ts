/**
 * List.kind's valid values. Plain string + this list (validated with Zod
 * wherever a kind is written), not a Postgres enum — see the comment on
 * List.kind in schema.prisma for why. Add a fourth type here + wherever
 * per-kind behavior branches; no migration needed.
 */
export const LIST_KINDS = ["shopping", "collection", "notes", "recipe"] as const;

export type ListKind = (typeof LIST_KINDS)[number];

export const LIST_KIND_LABELS: Record<ListKind, string> = {
  shopping: "Shopping list",
  collection: "Collection",
  notes: "Notes",
  recipe: "Recipe list",
};

/** Selectable day counts for List.resetIntervalDays — "Never" (null) isn't listed here, it's the absence of a selection. */
export const RESET_INTERVAL_DAYS = [1, 2, 3, 4, 5, 6, 7, 14, 21, 30] as const;

export const RESET_INTERVAL_OPTIONS = RESET_INTERVAL_DAYS.map((days) => ({
  days,
  label: `${days} day${days === 1 ? "" : "s"}`,
}));

/**
 * Lists-index sort modes. "custom" is drag order (List.position, see
 * reorderLists in actions.ts) and is the default — the other three are
 * one-off query sorts with no persisted order of their own.
 */
export const LIST_SORTS = ["custom", "name", "created", "kind"] as const;

export type ListSort = (typeof LIST_SORTS)[number];

export const LIST_SORT_LABELS: Record<ListSort, string> = {
  custom: "Custom",
  name: "Name",
  created: "Created",
  kind: "Type",
};

export function parseListSort(raw: string | undefined): ListSort {
  return (LIST_SORTS as readonly string[]).includes(raw ?? "") ? (raw as ListSort) : "custom";
}
