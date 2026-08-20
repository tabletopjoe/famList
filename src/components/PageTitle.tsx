"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { modules } from "@/modules/registry";

/** Shows the current module's name in the top bar (e.g. "Lists"), or the app name on the dashboard. */
export function PageTitle() {
  const pathname = usePathname();
  const activeModule = modules.find(
    (mod) => pathname === mod.href || pathname.startsWith(`${mod.href}/`)
  );

  // Lists can open straight to a primary list rather than the overview, so
  // its title doubles as a button back to the "all lists" view.
  if (activeModule?.key === "lists") {
    return (
      <Link
        href="/lists?view=all"
        className="truncate text-sm font-medium text-white/80 hover:text-white hover:underline"
      >
        {activeModule.name}
      </Link>
    );
  }

  return (
    <span className="truncate text-sm font-medium text-white/80">
      {activeModule ? activeModule.name : "famList"}
    </span>
  );
}
