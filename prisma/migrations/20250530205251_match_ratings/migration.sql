/*
  Warnings:

  - You are about to drop the column `createdAt` on the `MatchRating` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,matchId]` on the table `MatchRating` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MatchRating_matchId_userId_key";

-- AlterTable
ALTER TABLE "MatchRating" DROP COLUMN "createdAt";

-- CreateIndex
CREATE UNIQUE INDEX "MatchRating_userId_matchId_key" ON "MatchRating"("userId", "matchId");
