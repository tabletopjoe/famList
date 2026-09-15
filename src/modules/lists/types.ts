/**
 * List.kind's valid values. Plain string + this list (validated with Zod
 * wherever a kind is written), not a Postgres enum — see the comment on
 * List.kind in schema.prisma for why. Add a fourth type here + wherever
 * per-kind behavior branches; no migration needed.
 */
export const LIST_KINDS = ["shopping", "collection", "notes"] as const;

export type ListKind = (typeof LIST_KINDS)[number];

export const LIST_KIND_LABELS: Record<ListKind, string> = {
  shopping: "Shopping list",
  collection: "Collection",
  notes: "Notes",
};

/** Preset choices for List.resetIntervalDays — "Never" (null) isn't listed here, it's the absence of a selection. */
export const RESET_INTERVAL_OPTIONS = [
  { days: 1, label: "Daily" },
  { days: 7, label: "Weekly" },
  { days: 14, label: "Every 2 weeks" },
  { days: 30, label: "Monthly" },
] as const;

export const RESET_INTERVAL_DAYS = RESET_INTERVAL_OPTIONS.map((opt) => opt.days);
