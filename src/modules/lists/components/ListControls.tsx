"use client";

import { useTransition } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { setAllItemsDone } from "../actions";
import { useDeleteMode } from "./DeleteModeContext";
import { ListSettingsMenu } from "./ListSettingsMenu";
import type { ListKind } from "../types";

/**
 * Row of per-list controls, sitting under the title/back-link row and
 * above the add-item form — currently the delete-mode toggle, the
 * check-all/uncheck-all toggle, and the list settings menu (which stays
 * last), with sort/filter icons still to come. `relative` here is
 * load-bearing: it's what ListSettingsMenu's overlay panel positions
 * itself against (see that component for why).
 */
export function ListControls({
  listId,
  title,
  kind,
  resetIntervalDays,
  doneCount,
  totalCount,
}: {
  listId: string;
  title: string;
  kind: ListKind;
  resetIntervalDays: number | null;
  doneCount: number;
  totalCount: number;
}) {
  const { deleteMode, toggle } = useDeleteMode();
  const [isPending, startTransition] = useTransition();

  // Majority-checked -> uncheck all; otherwise (majority unchecked, or an
  // even split) -> check all.
  const target = doneCount > totalCount - doneCount ? false : true;

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
      <ListSettingsMenu
        listId={listId}
        title={title}
        kind={kind}
        resetIntervalDays={resetIntervalDays}
        totalCount={totalCount}
      />
    </div>
  );
}
