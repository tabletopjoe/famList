-- AlterTable
ALTER TABLE "User" ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'eggplant',
ADD COLUMN     "themeMode" TEXT NOT NULL DEFAULT 'dark';
