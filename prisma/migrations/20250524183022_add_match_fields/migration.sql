/*
  Warnings:

  - Made the column `loser` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Made the column `winner` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "duration" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "type" TEXT,
ALTER COLUMN "loser" SET NOT NULL,
ALTER COLUMN "winner" SET NOT NULL;
