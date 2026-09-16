/**
 * One-time import of the family's old Power App (SharePoint-backed) shopping
 * lists. Source data was exported from SharePoint to Excel, then flattened
 * to prisma/import-data/shoplist-export.json (see the extraction notes in
 * that directory) — that JSON, not the original .xlsx, is what this script
 * reads. Neither is committed (see .gitignore): it's real family data and
 * this script only ever needs to run once.
 *
 *   npx tsx prisma/import-sharepoint.ts
 *
 * Safe to re-run: items are de-duplicated by (list, label) so a second run
 * adds nothing new, though the Wegmans/Trader Joe's uncheck-all step (see
 * below) would fire again harmlessly.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const OWNER_EMAIL = "schlenkster@gmail.com";
const SHARE_WITH_EMAIL = "liza.avruch@gmail.com";

type SourceRow = {
  sourceId: string;
  title: string;
  listLookup: string;
  link: string;
  notes: string;
  purchased: string;
  created: string;
};

// SharePoint's ListLookup value -> the famList list it maps to, and the kind
// to use *only* when creating that list fresh. Wegmans and Trader Joe's
// already exist in famList, so their items merge into those lists as-is —
// this kind is never applied to them.
const LIST_KIND: Record<string, string> = {
  Wegmans: "shopping",
  "Trader Joe's": "shopping",
  "Home Depot": "shopping",
  Backpacking: "shopping",
  Recipes: "recipe",
  "Moovie Nights": "collection",
  Books: "collection",
  Lemniscate: "collection",
  "Edi's 15": "collection",
  "Edi's foods": "collection",
  "Bathroom remodel": "collection",
  "Nature Club Misc.": "notes",
  "Simone Doctor Appt. Qs": "notes",
};

// Excel/SharePoint's day-zero is 1899-12-30 (accounting for the historical
// 1900 leap-year bug), so a serial date is just that many days later.
function excelSerialToDate(serial: string): Date {
  const days = Number(serial);
  return new Date(Date.UTC(1899, 11, 30) + days * 86400 * 1000);
}

function normalizeForMatch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'");
}

async function main() {
  const raw: SourceRow[] = JSON.parse(readFileSync("prisma/import-data/shoplist-export.json", "utf-8"));

  const owner = await db.user.findUniqueOrThrow({ where: { email: OWNER_EMAIL } });
  const shareWith = await db.user.findUniqueOrThrow({ where: { email: SHARE_WITH_EMAIL } });

  // Existing Wegmans items were left checked off from testing the
  // check-all/uncheck-all button earlier — that's not real shopping state,
  // so clear it before merging in the SharePoint items.
  const existingWegmans = await db.list.findFirst({ where: { createdById: owner.id, title: "Wegmans" } });
  if (existingWegmans) {
    await db.listItem.updateMany({
      where: { listId: existingWegmans.id },
      data: { isDone: false, completedAt: null },
    });
    console.log("Reset existing Wegmans items to unchecked.");
  }

  const byList = new Map<string, SourceRow[]>();
  for (const row of raw) {
    const key = row.listLookup.trim();
    if (!byList.has(key)) byList.set(key, []);
    byList.get(key)!.push(row);
  }

  for (const [listLookup, rows] of byList) {
    const list = await findOrCreateList(owner.id, listLookup);

    const existingLabels = new Set(
      (await db.listItem.findMany({ where: { listId: list.id }, select: { label: true } })).map((i) =>
        normalizeForMatch(i.label),
      ),
    );

    let position = await db.listItem.count({ where: { listId: list.id, isDone: false } });
    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const label = row.title.trim();
      if (!label) continue;
      if (existingLabels.has(normalizeForMatch(label))) {
        skipped++;
        continue;
      }
      await db.listItem.create({
        data: {
          listId: list.id,
          label,
          notes: row.notes.trim() || null,
          link: row.link.trim() || null,
          isDone: false,
          position: position++,
          createdAt: row.created ? excelSerialToDate(row.created) : undefined,
        },
      });
      existingLabels.add(normalizeForMatch(label));
      created++;
    }

    await db.listShare.upsert({
      where: { listId_userId: { listId: list.id, userId: shareWith.id } },
      create: { listId: list.id, userId: shareWith.id },
      update: {},
    });

    console.log(`${listLookup} -> "${list.title}" (${list.kind}): +${created} items, skipped ${skipped} duplicates.`);
  }

  await db.$disconnect();
}

/** Reuses an existing list of the owner's with a matching title (ignoring case/apostrophe style); otherwise creates one with the mapped kind. */
async function findOrCreateList(ownerId: string, listLookup: string) {
  const title = listLookup.trim();
  const owned = await db.list.findMany({ where: { createdById: ownerId }, select: { id: true, title: true, kind: true } });
  const match = owned.find((l) => normalizeForMatch(l.title) === normalizeForMatch(title));
  if (match) return match;

  const kind = LIST_KIND[title] ?? "collection";
  return db.list.create({ data: { title, kind, createdById: ownerId } });
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
