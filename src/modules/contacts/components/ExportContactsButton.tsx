"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { useTopBarSlot } from "@/components/TopBarSlot";
import { exportContactsCsv } from "../actions";

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Renders nothing where it's placed — it just registers a "download" icon
 * button into the top bar (next to the "Contacts" title) via the
 * TopBarSlot, for as long as it's mounted. The parent only mounts it while
 * there's at least one contact to export.
 */
export function ExportContactsButton() {
  const [isPending, startTransition] = useTransition();

  useTopBarSlot(
    <button
      onClick={() => startTransition(async () => downloadCsv(await exportContactsCsv()))}
      disabled={isPending}
      aria-label="Export contacts to CSV"
      title="Export to CSV"
      className="flex size-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
    >
      <Download className="size-4" strokeWidth={1.75} />
    </button>
  );

  return null;
}
