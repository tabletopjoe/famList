import Link from "next/link";
import { Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { OWNERSHIP_FILTERS, OWNERSHIP_FILTER_LABELS, type OwnershipFilter } from "@/components/OwnershipFilterChips";
import {
  LIST_KINDS,
  LIST_KIND_LABELS,
  LIST_SORTS,
  LIST_SORT_LABELS,
  DEFAULT_SORT_DIR,
  type ListKind,
  type ListSort,
  type ListSortDir,
} from "../types";
import { chipClass } from "@/components/chipClass";

type Panel = "filter" | "sort";

// null ("Type", no filter) plus every kind, in a fixed loop — tapping the
// chip steps to whatever comes after the current value, wrapping back to
// null after the last kind.
const KIND_FILTER_CYCLE: (ListKind | null)[] = [null, ...LIST_KINDS];

function nextKindFilter(current: ListKind | null): ListKind | null {
  const i = KIND_FILTER_CYCLE.indexOf(current);
  return KIND_FILTER_CYCLE[(i + 1) % KIND_FILTER_CYCLE.length];
}

function hrefFor(next: {
  panel: Panel;
  filter: OwnershipFilter;
  type: ListKind | null;
  sort: ListSort;
  dir: ListSortDir;
}) {
  const params = new URLSearchParams({ view: "all" });
  // Sort is the default panel now — only "filter" needs to be spelled out.
  if (next.panel === "filter") params.set("panel", "filter");
  if (next.filter !== "all") params.set("filter", next.filter);
  if (next.type) params.set("type", next.type);
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
  typeFilter,
  sort,
  dir,
}: {
  panel: Panel;
  filter: OwnershipFilter;
  /** The "Type" chip's current value — see KIND_FILTER_CYCLE. */
  typeFilter: ListKind | null;
  sort: ListSort;
  dir: ListSortDir;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={hrefFor({ panel: panel === "filter" ? "sort" : "filter", filter, type: typeFilter, sort, dir })}
        aria-label={panel === "filter" ? "Switch to sorting" : "Switch to filtering"}
        title={panel === "filter" ? "Sort lists" : "Filter lists"}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground active:bg-foreground/20"
      >
        {panel === "filter" ? (
          <Filter className="size-4" strokeWidth={1.75} />
        ) : (
          <ArrowUpDown className="size-4" strokeWidth={1.75} />
        )}
      </Link>
      <div className="flex flex-nowrap gap-2 overflow-x-auto">
        {panel === "filter"
          ? [
              ...OWNERSHIP_FILTERS.map((f) => (
                <Link
                  key={f}
                  href={hrefFor({ panel, filter: f, type: typeFilter, sort, dir })}
                  className={chipClass(filter === f)}
                >
                  {OWNERSHIP_FILTER_LABELS[f]}
                </Link>
              )),
              // Its own chip rather than one-per-kind (unlike ownership above):
              // there's no natural "off" option to sit alongside Shopping/
              // Collection/etc., so tapping it instead steps through
              // null -> each kind -> null (see KIND_FILTER_CYCLE).
              <Link
                key="type"
                href={hrefFor({ panel, filter, type: nextKindFilter(typeFilter), sort, dir })}
                className={chipClass(typeFilter !== null)}
              >
                {typeFilter ? LIST_KIND_LABELS[typeFilter] : "Type"}
              </Link>,
            ]
          : LIST_SORTS.map((s) => {
              const active = sort === s;
              // Tapping the already-active sort flips its direction; picking
              // a different one starts fresh at that field's default.
              const nextDir = active ? (dir === "asc" ? "desc" : "asc") : DEFAULT_SORT_DIR[s];
              return (
                <Link
                  key={s}
                  href={hrefFor({ panel, filter, type: typeFilter, sort: s, dir: nextDir })}
                  className={chipClass(active)}
                >
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
