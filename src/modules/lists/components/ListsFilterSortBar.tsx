import Link from "next/link";
import { Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { OWNERSHIP_FILTERS, OWNERSHIP_FILTER_LABELS, type OwnershipFilter } from "@/components/OwnershipFilterChips";
import { LIST_SORTS, LIST_SORT_LABELS, DEFAULT_SORT_DIR, type ListSort, type ListSortDir } from "../types";
import { chipClass } from "../chipClass";

type Panel = "filter" | "sort";

function hrefFor(next: { panel: Panel; filter: OwnershipFilter; sort: ListSort; dir: ListSortDir }) {
  const params = new URLSearchParams({ view: "all" });
  if (next.panel === "sort") params.set("panel", "sort");
  if (next.filter !== "all") params.set("filter", next.filter);
  if (next.sort !== "custom") params.set("sort", next.sort);
  if (next.sort !== "custom" && next.dir !== DEFAULT_SORT_DIR[next.sort]) params.set("dir", next.dir);
  return `/lists?${params.toString()}`;
}

/**
 * Replaces the old always-visible filter chip row: one icon toggles which
 * chip row shows (filter vs. sort), and toggling never disturbs whichever
 * filter/sort is currently active underneath — both stay in effect
 * regardless of which row is on screen. Both rows are single-line and
 * horizontally scrollable rather than wrapping, so this bar's height never
 * changes and eats into the list below it.
 */
export function ListsFilterSortBar({
  panel,
  filter,
  sort,
  dir,
}: {
  panel: Panel;
  filter: OwnershipFilter;
  sort: ListSort;
  dir: ListSortDir;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={hrefFor({ panel: panel === "filter" ? "sort" : "filter", filter, sort, dir })}
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
      <div className="flex flex-nowrap gap-2 overflow-x-auto">
        {panel === "filter"
          ? OWNERSHIP_FILTERS.map((f) => (
              <Link key={f} href={hrefFor({ panel, filter: f, sort, dir })} className={chipClass(filter === f)}>
                {OWNERSHIP_FILTER_LABELS[f]}
              </Link>
            ))
          : LIST_SORTS.map((s) => {
              const active = sort === s;
              // Tapping the already-active sort flips its direction; picking
              // a different one starts fresh at that field's default.
              const nextDir = active ? (dir === "asc" ? "desc" : "asc") : DEFAULT_SORT_DIR[s];
              return (
                <Link key={s} href={hrefFor({ panel, filter, sort: s, dir: nextDir })} className={chipClass(active)}>
                  {LIST_SORT_LABELS[s]}
                  {active &&
                    s !== "custom" &&
                    (dir === "asc" ? (
                      <ArrowUp className="size-3" strokeWidth={2} />
                    ) : (
                      <ArrowDown className="size-3" strokeWidth={2} />
                    ))}
                </Link>
              );
            })}
      </div>
    </div>
  );
}
