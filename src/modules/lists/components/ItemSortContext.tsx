"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

function storageKey(listId: string) {
  return `famlist:itemSort:${listId}`;
}

/** Reads this browser's remembered sort for listId, if any — never touched during SSR (see the mount-time effect below, not this). */
function readStored(listId: string): { itemSort: ItemSort; categoryDir: CategorySortDir } | null {
  try {
    const raw = localStorage.getItem(storageKey(listId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.itemSort !== "custom" && parsed.itemSort !== "category") return null;
    if (parsed.categoryDir !== "position" && parsed.categoryDir !== "alpha") return null;
    return { itemSort: parsed.itemSort, categoryDir: parsed.categoryDir };
  } catch {
    return null;
  }
}

/**
 * Shared between ListControls (the toggle icon + chips) and ItemList (the
 * actual grouping/ordering) — same pattern as DeleteModeContext/
 * ItemEditContext, plus persistence: itemSort/categoryDir are remembered
 * per list (browser-local, not synced) so reopening a list you'd set to
 * "Category" still shows it that way. sortPanelOpen deliberately isn't
 * persisted — that's just whether the chip row happens to be showing, not
 * a view preference.
 */
export function ItemSortProvider({ listId, children }: { listId: string; children: ReactNode }) {
  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const [itemSort, setItemSortState] = useState<ItemSort>("custom");
  const [categoryDir, setCategoryDirState] = useState<CategorySortDir>("position");

  // Deferred to a mount-time effect (rather than useState's lazy initializer)
  // so the server-rendered markup and the client's first render match —
  // localStorage doesn't exist during SSR. Means a brief flash back to
  // "Custom" order on load if the remembered sort was "Category".
  useEffect(() => {
    const stored = readStored(listId);
    if (stored) {
      // Deliberate: this is the standard SSR-safe way to hydrate from
      // localStorage (match the server's default on first paint, then sync
      // once mounted) — there's no way to read it before this point without
      // a hydration mismatch, so the lint rule's general advice doesn't fit.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItemSortState(stored.itemSort);
      setCategoryDirState(stored.categoryDir);
    }
  }, [listId]);

  function persist(next: { itemSort: ItemSort; categoryDir: CategorySortDir }) {
    try {
      localStorage.setItem(storageKey(listId), JSON.stringify(next));
    } catch {
      // Private browsing / storage disabled — the sort still works for this
      // session, it just won't be remembered next time.
    }
  }

  function setItemSort(sort: ItemSort) {
    setItemSortState(sort);
    persist({ itemSort: sort, categoryDir });
  }

  function setCategoryDir(dir: CategorySortDir) {
    setCategoryDirState(dir);
    persist({ itemSort, categoryDir: dir });
  }

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
