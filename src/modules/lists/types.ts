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
