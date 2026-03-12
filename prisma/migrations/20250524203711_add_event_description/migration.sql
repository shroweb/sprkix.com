/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `profightdbUrl` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "createdAt",
DROP COLUMN "profightdbUrl",
ADD COLUMN     "description" TEXT;
