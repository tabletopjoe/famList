"use client";

import { Trash2 } from "lucide-react";
import { useDeleteMode } from "./DeleteModeContext";
import { ListSettingsMenu } from "./ListSettingsMenu";
import type { ListKind } from "../types";

/**
 * Row of per-list controls, sitting under the title/back-link row and
 * above the add-item form — currently the delete-mode toggle and the list
 * settings menu, with sort/filter icons still to come. `relative` here is
 * load-bearing: it's what ListSettingsMenu's overlay panel positions
 * itself against (see that component for why).
 */
export function ListControls({
  listId,
  kind,
  resetIntervalDays,
}: {
  listId: string;
  kind: ListKind;
  resetIntervalDays: number | null;
}) {
  const { deleteMode, toggle } = useDeleteMode();

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
      <ListSettingsMenu listId={listId} kind={kind} resetIntervalDays={resetIntervalDays} />
    </div>
  );
}
