/*
  Warnings:

  - You are about to drop the column `loser` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `winner` on the `Match` table. All the data in the column will be lost.
  - The `duration` column on the `Match` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `title` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_eventId_fkey";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "loser",
DROP COLUMN "order",
DROP COLUMN "winner",
ADD COLUMN     "rating" DOUBLE PRECISION,
DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER,
ALTER COLUMN "title" SET NOT NULL;

-- CreateTable
CREATE TABLE "Wrestler" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wrestler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "wrestlerId" TEXT NOT NULL,
    "team" INTEGER,
    "isWinner" BOOLEAN,

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wrestler_slug_key" ON "Wrestler"("slug");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_wrestlerId_fkey" FOREIGN KEY ("wrestlerId") REFERENCES "Wrestler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
