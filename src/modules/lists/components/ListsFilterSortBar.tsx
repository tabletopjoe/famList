import Link from "next/link";
import { Filter, ArrowUpDown } from "lucide-react";
import { OWNERSHIP_FILTERS, OWNERSHIP_FILTER_LABELS, type OwnershipFilter } from "@/components/OwnershipFilterChips";
import { LIST_SORTS, LIST_SORT_LABELS, type ListSort } from "../types";

type Panel = "filter" | "sort";

function chipClass(active: boolean) {
  return `rounded-full px-3 py-1 text-sm transition-colors ${
    active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
  }`;
}

function hrefFor(next: { panel: Panel; filter: OwnershipFilter; sort: ListSort }) {
  const params = new URLSearchParams({ view: "all" });
  if (next.panel === "sort") params.set("panel", "sort");
  if (next.filter !== "all") params.set("filter", next.filter);
  if (next.sort !== "custom") params.set("sort", next.sort);
  return `/lists?${params.toString()}`;
}

/**
 * Replaces the old always-visible filter chip row: one icon toggles which
 * chip row shows (filter vs. sort), and toggling never disturbs whichever
 * filter/sort is currently active underneath — both stay in effect
 * regardless of which row is on screen.
 */
export function ListsFilterSortBar({ panel, filter, sort }: { panel: Panel; filter: OwnershipFilter; sort: ListSort }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={hrefFor({ panel: panel === "filter" ? "sort" : "filter", filter, sort })}
        aria-label={panel === "filter" ? "Switch to sorting" : "Switch to filtering"}
        title={panel === "filter" ? "Sort lists" : "Filter lists"}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        {panel === "filter" ? (
          <Filter className="size-4" strokeWidth={1.75} />
        ) : (
          <ArrowUpDown className="size-4" strokeWidth={1.75} />
        )}
      </Link>
      <div className="flex flex-wrap gap-2">
        {panel === "filter"
          ? OWNERSHIP_FILTERS.map((f) => (
              <Link key={f} href={hrefFor({ panel, filter: f, sort })} className={chipClass(filter === f)}>
                {OWNERSHIP_FILTER_LABELS[f]}
              </Link>
            ))
          : LIST_SORTS.map((s) => (
              <Link key={s} href={hrefFor({ panel, filter, sort: s })} className={chipClass(sort === s)}>
                {LIST_SORT_LABELS[s]}
              </Link>
            ))}
      </div>
    </div>
  );
}
