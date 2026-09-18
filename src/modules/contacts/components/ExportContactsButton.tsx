"use client";

import { Download } from "lucide-react";
import { useTopBarSlot } from "@/components/TopBarSlot";

/**
 * Renders nothing where it's placed — it just registers a "download" icon
 * link into the top bar (next to the "Contacts" title) via the TopBarSlot,
 * for as long as it's mounted. The parent only mounts it while there's at
 * least one contact to export.
 *
 * A plain link to a route (see src/app/api/contacts/export), not a
 * client-triggered Blob download — see that route for why.
 */
export function ExportContactsButton() {
  useTopBarSlot(
    <a
      href="/api/contacts/export"
      aria-label="Export contacts to CSV"
      title="Export to CSV"
      className="flex size-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Download className="size-4" strokeWidth={1.75} />
    </a>
  );

  return null;
}
