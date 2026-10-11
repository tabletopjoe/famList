import type { ContactSubmission } from "../queries";
import { LocalDateTime } from "./LocalDateTime";

/** One orbLand inquiry — same card styling as the admin UserRow. */
export function ContactSubmissionRow({ submission }: { submission: ContactSubmission }) {
  return (
    <div className="rounded-lg border border-foreground/15 bg-card-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{submission.name}</p>
          <a
            href={`mailto:${submission.email}`}
            className="text-sm break-all text-foreground/60 hover:text-foreground hover:underline"
          >
            {submission.email}
          </a>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm">
          {submission.interest && (
            <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs">{submission.interest}</span>
          )}
          {submission.status === "new" && (
            <span className="rounded-full bg-amber-300/15 px-2.5 py-0.5 text-xs text-amber-300">New</span>
          )}
          <LocalDateTime date={submission.createdAt} className="text-foreground/50" />
        </div>
      </div>
      <p className="mt-3 text-sm whitespace-pre-wrap text-foreground/80">{submission.message}</p>
    </div>
  );
}
