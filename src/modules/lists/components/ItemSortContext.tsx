"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ItemSort = "custom" | "category";
/** Only meaningful when itemSort is "category": group categories by their own drag order, or alphabetically. */
export type CategorySortDir = "position" | "alpha";

type ItemSortState = {
  /** Whether the sort chip row is showing in place of ListControls' usual buttons — independent of which sort is actually active. */
  sortPanelOpen: boolean;
  toggleSortPanel: () => void;
  itemSort: ItemSort;
  setItemSort: (sort: ItemSort) => void;
  categoryDir: CategorySortDir;
  setCategoryDir: (dir: CategorySortDir) => void;
};

const ItemSortContext = createContext<ItemSortState | null>(null);

/** Shared between ListControls (the toggle icon + chips) and ItemList (the actual grouping/ordering) — same pattern as DeleteModeContext/ItemEditContext. */
export function ItemSortProvider({ children }: { children: ReactNode }) {
  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const [itemSort, setItemSort] = useState<ItemSort>("custom");
  const [categoryDir, setCategoryDir] = useState<CategorySortDir>("position");

  return (
    <ItemSortContext.Provider
      value={{
        sortPanelOpen,
        toggleSortPanel: () => setSortPanelOpen((v) => !v),
        itemSort,
        setItemSort,
        categoryDir,
        setCategoryDir,
      }}
    >
      {children}
    </ItemSortContext.Provider>
  );
}

export function useItemSort() {
  const ctx = useContext(ItemSortContext);
  if (!ctx) throw new Error("useItemSort must be used within an ItemSortProvider");
  return ctx;
}
