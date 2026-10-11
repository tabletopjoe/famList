"use client";

/**
 * Formats in the viewer's own time zone. The server renders in UTC, so the
 * first paint can differ from the hydrated text — hence suppressHydrationWarning.
 */
export function LocalDateTime({ date, className }: { date: Date; className?: string }) {
  return (
    <time dateTime={date.toISOString()} className={className} suppressHydrationWarning>
      {date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
}
