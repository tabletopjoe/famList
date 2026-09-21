/** Shared pill styling for chip rows (OwnershipFilterChips, ListsFilterSortBar, ListControls' sort panel). */
export function chipClass(active: boolean) {
  return `inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors ${
    active
      ? "bg-foreground/15 text-foreground active:bg-foreground/25"
      : "text-foreground/60 hover:bg-foreground/10 hover:text-foreground active:bg-foreground/20"
  }`;
}
