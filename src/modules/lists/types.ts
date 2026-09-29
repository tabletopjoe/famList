/**
 * List.kind's valid values. Plain string + this list (validated with Zod
 * wherever a kind is written), not a Postgres enum — see the comment on
 * List.kind in schema.prisma for why. Add a fourth type here + wherever
 * per-kind behavior branches; no migration needed.
 */
export const LIST_KINDS = ["shopping", "collection", "notes", "recipe", "project"] as const;

export type ListKind = (typeof LIST_KINDS)[number];

export const LIST_KIND_LABELS: Record<ListKind, string> = {
  shopping: "Shopping list",
  collection: "Collection",
  notes: "Notes",
  recipe: "Recipe list",
  project: "Project list",
};

/** Short "what's this for" hint shown after the label wherever a kind is being picked (create form, list settings) — not on cards or filter chips, where the bare label reads better. */
const LIST_KIND_HINTS: Partial<Record<ListKind, string>> = {
  shopping: "checklist",
  collection: "simple",
  notes: "text/links",
  project: "tasks/tracking",
};

export function listKindOptionLabel(kind: ListKind): string {
  const hint = LIST_KIND_HINTS[kind];
  return hint ? `${LIST_KIND_LABELS[kind]} (${hint})` : LIST_KIND_LABELS[kind];
}

/** Kinds whose items have a checkbox (isDone) at all. */
export function isChecklistKind(kind: ListKind): boolean {
  return kind === "shopping" || kind === "project";
}

/**
/** The lists-index "Type" filter chip's value — parsed from the `type` search param; absent/invalid means no type filter. */
export function parseListKindFilter(raw: string | undefined): ListKind | null {
  return (LIST_KINDS as readonly string[]).includes(raw ?? "") ? (raw as ListKind) : null;
}

/**
 * Seeded onto a list when it's created as, or switched to, one of these
 * kinds (see ensurePresetCategories in actions.ts) — only the missing ones
 * are added, and existing categories are never removed. A starting point,
 * not a fixed set; users can rename, delete, or add to them freely
 * afterward same as any other category. Kinds not listed here (collection,
 * notes) start with none.
 */
export const PRESET_CATEGORIES: Partial<Record<ListKind, string[]>> = {
  shopping: ["Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Frozen", "Pantry", "Household", "Other"],
  recipe: ["Breakfast", "Dessert", "Entree", "Soup", "Sauces", "Sides"],
};

/** Same idea as PRESET_CATEGORIES, for project lists' Status values (see Status in schema.prisma). */
export const PRESET_STATUSES: Partial<Record<ListKind, string[]>> = {
  project: ["In Progress", "Completed", "Canceled"],
};

/**
 * The status name (matched case-insensitively) that's kept in sync with an
 * item's isDone checkbox on project lists: choosing it checks the item
 * off, checking the item off selects it. If a list has no status by this
 * name (the user deleted it), the checkbox just works on its own.
 */
export const COMPLETED_STATUS = "Completed";
/** What a project item's status falls back to when it's un-checked while "Completed". */
export const REOPENED_STATUS = "In Progress";

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

export type ListSortDir = "asc" | "desc";

/** Each sort field's direction when first selected — tapping its chip again flips it from there. Meaningless for "custom" (drag order has no direction). */
export const DEFAULT_SORT_DIR: Record<ListSort, ListSortDir> = {
  custom: "asc",
  name: "asc",
  created: "desc",
  kind: "asc",
};

export function parseListSortDir(raw: string | undefined, sort: ListSort): ListSortDir {
  return raw === "asc" || raw === "desc" ? raw : DEFAULT_SORT_DIR[sort];
}
