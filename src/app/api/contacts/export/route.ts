// A real HTTP endpoint (not a Server Action + client-side Blob) specifically
// so the download works via a plain <a href> navigation — iOS Safari doesn't
// reliably trigger a save for a JS-constructed Blob URL once there's any
// async gap between the click and the anchor's own .click() call (as there
// necessarily is when the CSV comes back from a Server Action). A
// Content-Disposition: attachment response has no such gesture requirement.
import { verifySession } from "@/lib/auth/dal";
import { getContactsCsv } from "@/modules/contacts/queries";

export async function GET() {
  const session = await verifySession();
  const csv = await getContactsCsv(session.userId);
  const filename = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
