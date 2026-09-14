"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** A section whose body is hidden until its header (title + chevron) is clicked/tapped — used to keep pages like Settings from dumping every field on screen at once. */
export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <h2 className="text-lg font-medium">{title}</h2>
        <ChevronDown
          className={`size-5 shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>
      {open && children}
    </section>
  );
}
