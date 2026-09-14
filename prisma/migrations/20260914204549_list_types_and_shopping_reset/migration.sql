-- Existing lists all have kind='general' (the old, unused default — nothing
-- in the app has ever set or read this column). Remap them to 'collection',
-- which matches their current behavior exactly, before "general" stops
-- being a valid value. New lists default to 'shopping' going forward.
UPDATE "List" SET "kind" = 'collection' WHERE "kind" = 'general';

-- AlterTable
ALTER TABLE "List" ALTER COLUMN "kind" SET DEFAULT 'shopping';
ALTER TABLE "List" ADD COLUMN "resetIntervalDays" INTEGER;

-- AlterTable
ALTER TABLE "ListItem" ADD COLUMN "completedAt" TIMESTAMP(3);
