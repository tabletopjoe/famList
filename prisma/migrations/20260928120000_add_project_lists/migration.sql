-- AlterTable
ALTER TABLE "ListItem" ADD COLUMN     "dependsOnId" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "person" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "statusId" TEXT;

-- CreateTable
CREATE TABLE "Status" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "listId" TEXT NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Status_listId_name_key" ON "Status"("listId", "name");

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "ListItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

