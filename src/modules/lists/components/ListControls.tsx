"use client";

import { Trash2 } from "lucide-react";
import { useDeleteMode } from "./DeleteModeContext";

/**
 * Row of per-list controls, sitting under the title/back-link row and
 * above the add-item form — currently just the delete-mode toggle, but the
 * home for whatever list-level controls come next (so they land here
 * rather than getting bolted onto AddItemForm again).
 */
export function ListControls() {
  const { deleteMode, toggle } = useDeleteMode();

  return (
    <div className="flex items-center gap-2">
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
    </div>
  );
}
