-- Existing List/ListItem/Contact rows are disposable test data (per
-- product decision) — clear them rather than backfilling shares/primary
-- state for them. User accounts are untouched.
DELETE FROM "ListItem";
DELETE FROM "List";
DELETE FROM "Contact";

-- AlterTable: List.isPrimary -> User.primaryListId (a per-user preference,
-- not a property of the list)
ALTER TABLE "List" DROP COLUMN "isPrimary";

ALTER TABLE "User" ADD COLUMN "primaryListId" TEXT;

-- CreateTable
CREATE TABLE "ListShare" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSharePair" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSharePair_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryListId_key" ON "User"("primaryListId");

-- CreateIndex
CREATE UNIQUE INDEX "ListShare_listId_userId_key" ON "ListShare"("listId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactSharePair_userAId_userBId_key" ON "ContactSharePair"("userAId", "userBId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primaryListId_fkey" FOREIGN KEY ("primaryListId") REFERENCES "List"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListShare" ADD CONSTRAINT "ListShare_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListShare" ADD CONSTRAINT "ListShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSharePair" ADD CONSTRAINT "ContactSharePair_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSharePair" ADD CONSTRAINT "ContactSharePair_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
