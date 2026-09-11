"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const DeleteModeContext = createContext<{ deleteMode: boolean; toggle: () => void } | null>(null);

/**
 * Shared on/off switch between AddItemForm (renders the toggle button) and
 * each ItemRow (swaps its up/down sort icons for a delete icon while it's
 * on). Keeping delete out of the sort controls' reach the rest of the time
 * is the whole point — it's what stops a mis-tap while reordering from
 * deleting an item.
 */
export function DeleteModeProvider({ children }: { children: ReactNode }) {
  const [deleteMode, setDeleteMode] = useState(false);

  return (
    <DeleteModeContext.Provider value={{ deleteMode, toggle: () => setDeleteMode((v) => !v) }}>
      {children}
    </DeleteModeContext.Provider>
  );
}

export function useDeleteMode() {
  const ctx = useContext(DeleteModeContext);
  if (!ctx) throw new Error("useDeleteMode must be used within a DeleteModeProvider");
  return ctx;
}
