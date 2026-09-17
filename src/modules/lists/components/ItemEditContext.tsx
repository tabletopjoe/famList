"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const ItemEditContext = createContext<{
  editingId: string | null;
  setEditingId: (id: string | null) => void;
} | null>(null);

/**
 * Shared between ItemList (owns the filtered-row + ItemEditForm display)
 * and ListControls (hides its icon row while something's being edited, to
 * give the edit form's Notes field more room) — same pattern as
 * DeleteModeContext.
 */
export function ItemEditProvider({ children }: { children: ReactNode }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return <ItemEditContext.Provider value={{ editingId, setEditingId }}>{children}</ItemEditContext.Provider>;
}

export function useItemEdit() {
  const ctx = useContext(ItemEditContext);
  if (!ctx) throw new Error("useItemEdit must be used within an ItemEditProvider");
  return ctx;
}
