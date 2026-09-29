/**
 * Project-item dates are calendar days stored as UTC midnight (see
 * ListItem.startDate in schema.prisma), so everything here reads them back
 * in UTC — reading them in local time would shift them a day for anyone
 * west of Greenwich.
 */

/** The "YYYY-MM-DD" an <input type="date"> expects, or "" for none. */
export function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/** Short display form, e.g. "Sep 30". Fixed locale so server and client render the same text. */
export function formatDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Whether a due day has passed, judged against the viewer's own local "today". */
export function isPastDue(dueDate: Date): boolean {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return toDateInputValue(dueDate) < today;
}
