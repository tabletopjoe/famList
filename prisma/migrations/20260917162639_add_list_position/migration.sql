-- AlterTable
ALTER TABLE "List" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill: preserve today's display order (newest first) as explicit
-- positions, so switching getLists to "ORDER BY position" doesn't reshuffle
-- anything until someone actually drags a list.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" DESC) - 1 AS rn
  FROM "List"
)
UPDATE "List"
SET "position" = ranked.rn
FROM ranked
WHERE "List"."id" = ranked."id";
