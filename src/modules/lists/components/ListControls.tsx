"use client";

import { Trash2, ArrowUpDown, ArrowDownAZ, ListOrdered, Square, SquareCheck, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useDeleteMode } from "./DeleteModeContext";
import { useItemEdit } from "./ItemEditContext";
import { useItemSort } from "./ItemSortContext";
import { ListSettingsMenu } from "./ListSettingsMenu";
import { chipClass } from "@/components/chipClass";
import { collapsibleGroupKeys } from "../itemGroups";
import type { ListKind } from "../types";

type OtherUser = { id: string; name: string };

/**
 * Row of per-list controls, sitting under the title/back-link row and
 * above the add-item form. Normally the delete-mode toggle, the sort-mode
 * toggle, expand-all / collapse-all (each only when there's a group it
 * would change), and (rightmost) the list settings menu — check/uncheck-all
 * lives in that menu. Toggling sort mode replaces all of those with the
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
  items,
  categories,
  statuses,
  isOwner,
  otherUsers,
  sharedWithIds,
}: {
  listId: string;
  title: string;
  kind: ListKind;
  resetIntervalDays: number | null;
  items: { isDone: boolean; categoryId: string | null }[];
  categories: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
  isOwner: boolean;
  otherUsers: OtherUser[];
  sharedWithIds: string[];
}) {
  const { deleteMode, toggle } = useDeleteMode();
  const { editingId } = useItemEdit();
  const {
    sortPanelOpen,
    toggleSortPanel,
    itemSort,
    setItemSort,
    categoryDir,
    setCategoryDir,
    checkedDir,
    setCheckedDir,
    isGroupCollapsed,
    setGroupsCollapsed,
  } = useItemSort();

  // The groups ItemList is showing. A done-group sub-group only counts
  // while its parent is open — otherwise it isn't on screen, so it
  // shouldn't make a button appear. Expand/collapse-all still apply to
  // every group, hidden sub-groups included.
  const groups = collapsibleGroupKeys(items, kind, itemSort, categories);
  const groupKeys = groups.map((g) => g.key);
  const onScreen = groups.filter((g) => !g.parent || !isGroupCollapsed(g.parent));
  const anyCollapsed = onScreen.some((g) => isGroupCollapsed(g.key));
  const anyExpanded = onScreen.some((g) => !isGroupCollapsed(g.key));
  const iconButtonClass =
    "flex size-7.5 shrink-0 items-center justify-center rounded-md text-foreground/40 transition-colors hover:text-foreground/70 active:bg-foreground/25";

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
      className={`flex size-7.5 shrink-0 items-center justify-center rounded-md transition-colors active:bg-foreground/25 ${
        sortPanelOpen ? "bg-foreground/15 text-foreground" : "text-foreground/40 hover:text-foreground/70"
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
          <button
            type="button"
            onClick={() => setItemSort("custom")}
            // A remembered "checked" on a non-shopping list displays as
            // Custom (see ItemList), so light this chip up for it too.
            className={chipClass(itemSort === "custom" || (itemSort === "checked" && kind !== "shopping"))}
          >
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
          {/* Shopping lists only. Same tap-again-to-flip pattern as
              Category: the icon shows which group is currently on top. */}
          {kind === "shopping" && (
            <button
              type="button"
              onClick={() => {
                if (itemSort === "checked") setCheckedDir(checkedDir === "unchecked" ? "checked" : "unchecked");
                else setItemSort("checked");
              }}
              className={chipClass(itemSort === "checked")}
            >
              Checked
              {itemSort === "checked" &&
                (checkedDir === "checked" ? (
                  <SquareCheck className="size-3" strokeWidth={2} />
                ) : (
                  <Square className="size-3" strokeWidth={2} />
                ))}
            </button>
          )}
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
        className={`flex size-7.5 items-center justify-center rounded-md transition-colors ${
          deleteMode
            ? "bg-red-600/15 text-red-500 active:bg-red-600/25"
            : "text-foreground/40 hover:text-red-600 active:bg-red-600/10 active:text-red-600 dark:hover:text-red-400"
        }`}
      >
        <Trash2 className="size-4" strokeWidth={1.75} />
      </button>
      {sortToggleButton}
      {anyExpanded && (
        <button
          type="button"
          onClick={() => setGroupsCollapsed(groupKeys, true)}
          aria-label="Collapse all groups"
          title="Collapse all groups"
          className={iconButtonClass}
        >
          <ChevronsDownUp className="size-4" strokeWidth={1.75} />
        </button>
      )}
      {anyCollapsed && (
        <button
          type="button"
          onClick={() => setGroupsCollapsed(groupKeys, false)}
          aria-label="Expand all groups"
          title="Expand all groups"
          className={iconButtonClass}
        >
          <ChevronsUpDown className="size-4" strokeWidth={1.75} />
        </button>
      )}
      <ListSettingsMenu
        listId={listId}
        title={title}
        kind={kind}
        resetIntervalDays={resetIntervalDays}
        doneCount={items.filter((item) => item.isDone).length}
        totalCount={items.length}
        categories={categories}
        statuses={statuses}
        isOwner={isOwner}
        otherUsers={otherUsers}
        sharedWithIds={sharedWithIds}
      />
    </div>
  );
}
