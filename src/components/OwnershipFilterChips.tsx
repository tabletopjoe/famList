import Link from "next/link";

export type OwnershipFilter = "all" | "mine" | "shared";

export const OWNERSHIP_FILTERS: OwnershipFilter[] = ["all", "mine", "shared"];

export const OWNERSHIP_FILTER_LABELS: Record<OwnershipFilter, string> = {
  all: "All",
  mine: "Mine",
  shared: "Shared",
};

export function parseOwnershipFilter(raw: string | undefined): OwnershipFilter {
  return raw === "mine" || raw === "shared" ? raw : "all";
}

/**
 * Reused on Lists and Contacts — both merge "mine" + "shared with me" into
 * one pool by default; this narrows that view. A plain server component
 * (just links with different query strings), no client state needed.
 * `hrefFor` lets each caller preserve its own other search params (Lists
 * keeps ?view=all alongside the filter).
 */
export function OwnershipFilterChips({
  current,
  hrefFor,
}: {
  current: OwnershipFilter;
  hrefFor: (filter: OwnershipFilter) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OWNERSHIP_FILTERS.map((filter) => (
        <Link
          key={filter}
          href={hrefFor(filter)}
          className={`rounded-full px-3 py-1 text-sm transition-colors ${
            current === filter ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {OWNERSHIP_FILTER_LABELS[filter]}
        </Link>
      ))}
    </div>
  );
}
