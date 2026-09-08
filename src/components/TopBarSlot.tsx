"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Split into two contexts on purpose: useTopBarSlot only ever reads the
// setter, whose identity from useState never changes across renders. If it
// instead read the content too, calling setContent would change that context
// value, re-render the calling component, produce a brand-new `content` node,
// and re-fire the registering effect — forever.
const TopBarSlotSetterContext = createContext<((content: ReactNode) => void) | null>(null);
const TopBarSlotContentContext = createContext<ReactNode>(null);

/**
 * Lets a page (rendered inside AppLayout's <main>) place content next to the
 * top bar's title, even though the header lives in the shared layout above
 * it. Wrap the layout in `<TopBarSlotProvider>`, render `<TopBarSlotOutlet />`
 * where the content should appear, and call `useTopBarSlot(...)` from a page.
 */
export function TopBarSlotProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null);

  return (
    <TopBarSlotSetterContext.Provider value={setContent}>
      <TopBarSlotContentContext.Provider value={content}>{children}</TopBarSlotContentContext.Provider>
    </TopBarSlotSetterContext.Provider>
  );
}

export function TopBarSlotOutlet() {
  return <>{useContext(TopBarSlotContentContext)}</>;
}

/** Registers `content` in the top bar slot for as long as the calling component is mounted. */
export function useTopBarSlot(content: ReactNode) {
  const setContent = useContext(TopBarSlotSetterContext);

  useEffect(() => {
    setContent?.(content);
    return () => setContent?.(null);
  }, [setContent, content]);
}
