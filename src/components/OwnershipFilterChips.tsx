import Link from "next/link";
import { chipClass } from "./chipClass";

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
        <Link key={filter} href={hrefFor(filter)} className={chipClass(current === filter)}>
          {OWNERSHIP_FILTER_LABELS[filter]}
        </Link>
      ))}
    </div>
  );
}
