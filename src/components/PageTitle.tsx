"use client";

import { usePathname } from "next/navigation";
import { modules } from "@/modules/registry";

/** Shows the current module's name in the top bar (e.g. "Lists"), or the app name on the dashboard. */
export function PageTitle() {
  const pathname = usePathname();
  const activeModule = modules.find(
    (mod) => pathname === mod.href || pathname.startsWith(`${mod.href}/`)
  );

  return (
    <span className="truncate text-sm font-medium text-white/80">
      {activeModule ? activeModule.name : "famList"}
    </span>
  );
}
