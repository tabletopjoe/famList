/** Shared pill styling for the sort/filter chip rows (ListsFilterSortBar, ListControls' sort panel). */
export function chipClass(active: boolean) {
  return `inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors ${
    active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
  }`;
}
