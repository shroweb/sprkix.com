/*
  Warnings:

  - You are about to drop the column `tmdbId` on the `Event` table. All the data in the column will be lost.
  - Made the column `result` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "tmdbId";

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "result" SET NOT NULL;
