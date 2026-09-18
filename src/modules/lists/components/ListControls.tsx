"use client";

import { useTransition } from "react";
import { RefreshCw, Trash2, ArrowUpDown, ArrowDownAZ, ListOrdered } from "lucide-react";
import { setAllItemsDone } from "../actions";
import { useDeleteMode } from "./DeleteModeContext";
import { useItemEdit } from "./ItemEditContext";
import { useItemSort } from "./ItemSortContext";
import { ListSettingsMenu } from "./ListSettingsMenu";
import { chipClass } from "@/components/chipClass";
import type { ListKind } from "../types";

/**
 * Row of per-list controls, sitting under the title/back-link row and
 * above the add-item form. Normally the delete-mode toggle, the
 * check-all/uncheck-all toggle, the sort-mode toggle, and (rightmost) the
 * list settings menu. Toggling sort mode replaces all of those with the
 * Custom/Category sort chips instead — the toggle icon stays put either way
 * so you can flip back. `relative` here is load-bearing when the normal
 * controls are showing: it's what ListSettingsMenu's overlay panel
 * positions itself against (see that component for why).
 */
export function ListControls({
  listId,
  title,
  kind,
  resetIntervalDays,
  doneCount,
  totalCount,
  categories,
}: {
  listId: string;
  title: string;
  kind: ListKind;
  resetIntervalDays: number | null;
  doneCount: number;
  totalCount: number;
  categories: { id: string; name: string }[];
}) {
  const { deleteMode, toggle } = useDeleteMode();
  const { editingId } = useItemEdit();
  const { sortPanelOpen, toggleSortPanel, itemSort, setItemSort, categoryDir, setCategoryDir } = useItemSort();
  const [isPending, startTransition] = useTransition();

  // Majority-checked -> uncheck all; otherwise (majority unchecked, or an
  // even split) -> check all.
  const target = doneCount > totalCount - doneCount ? false : true;

  // Editing an item collapses the list down to just that row + the edit
  // form — these controls don't apply to anything visible while that's up,
  // and hiding them gives the edit form's Notes field more room.
  if (editingId) return null;

  const sortToggleButton = (
    <button
      type="button"
      onClick={toggleSortPanel}
      aria-pressed={sortPanelOpen}
      aria-label={sortPanelOpen ? "Hide sort options" : "Sort items"}
      title={sortPanelOpen ? "Hide sort options" : "Sort items"}
      className={`flex size-8 shrink-0 items-center justify-center rounded-md transition-colors ${
        sortPanelOpen
          ? "bg-white/15 text-white"
          : "text-black/40 hover:text-black/70 dark:text-white/40 dark:hover:text-white/70"
      }`}
    >
      <ArrowUpDown className="size-4" strokeWidth={1.75} />
    </button>
  );

  if (sortPanelOpen) {
    return (
      <div className="flex items-center gap-2">
        {sortToggleButton}
        <div className="flex flex-nowrap gap-2 overflow-x-auto">
          <button type="button" onClick={() => setItemSort("custom")} className={chipClass(itemSort === "custom")}>
            Custom
          </button>
          <button
            type="button"
            onClick={() => {
              // Tapping it again (already active) flips how the category
              // groups themselves are ordered; picking it fresh starts at
              // their own drag order.
              if (itemSort === "category") setCategoryDir(categoryDir === "position" ? "alpha" : "position");
              else setItemSort("category");
            }}
            className={chipClass(itemSort === "category")}
          >
            Category
            {itemSort === "category" &&
              (categoryDir === "alpha" ? (
                <ArrowDownAZ className="size-3" strokeWidth={2} />
              ) : (
                <ListOrdered className="size-3" strokeWidth={2} />
              ))}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={deleteMode}
        aria-label={deleteMode ? "Done deleting items" : "Delete items"}
        title={deleteMode ? "Done deleting items" : "Delete items"}
        className={`flex size-8 items-center justify-center rounded-md transition-colors ${
          deleteMode
            ? "bg-red-600/15 text-red-500"
            : "text-black/40 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400"
        }`}
      >
        <Trash2 className="size-4" strokeWidth={1.75} />
      </button>
      {/* Only shopping lists show checkboxes day-to-day, so this is the only kind where check/uncheck-all does anything visible. */}
      {kind === "shopping" && (
        <button
          type="button"
          onClick={() => startTransition(() => setAllItemsDone(listId, target))}
          disabled={isPending || totalCount === 0}
          aria-label={target ? "Check all items" : "Uncheck all items"}
          title={target ? "Check all items" : "Uncheck all items"}
          className="flex size-8 items-center justify-center rounded-md text-black/40 transition-colors hover:text-black/70 disabled:opacity-30 disabled:hover:text-black/40 dark:text-white/40 dark:hover:text-white/70 dark:disabled:hover:text-white/40"
        >
          <RefreshCw className="size-4" strokeWidth={1.75} />
        </button>
      )}
      {sortToggleButton}
      <ListSettingsMenu
        listId={listId}
        title={title}
        kind={kind}
        resetIntervalDays={resetIntervalDays}
        totalCount={totalCount}
        categories={categories}
      />
    </div>
  );
}
