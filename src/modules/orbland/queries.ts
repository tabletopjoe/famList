import "server-only";
import { db } from "@/lib/db";

export type ContactSubmission = {
  id: string;
  createdAt: Date;
  name: string;
  email: string;
  interest: string | null;
  message: string;
  status: string;
  emailSent: boolean;
};

type Row = Omit<ContactSubmission, "id"> & { id: bigint };

/**
 * orbLand's contact form inquiries. They live in the `orbland` schema of this
 * same Neon database — owned and migrated by the orbLand repo, not Prisma — so
 * this reads them with raw SQL instead of adding the table to schema.prisma
 * (which would make `prisma migrate` try to manage it).
 */
export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  const rows = await db.$queryRaw<Row[]>`
    SELECT id, created_at AS "createdAt", name, email, interest, message, status, email_sent AS "emailSent"
    FROM orbland.contact_submissions
    ORDER BY created_at DESC`;
  return rows.map((r) => ({ ...r, id: r.id.toString() }));
}
