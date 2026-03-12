-- DropForeignKey
ALTER TABLE "MatchParticipant" DROP CONSTRAINT "MatchParticipant_matchId_fkey";

-- DropForeignKey
ALTER TABLE "MatchParticipant" DROP CONSTRAINT "MatchParticipant_wrestlerId_fkey";

-- DropForeignKey
ALTER TABLE "MatchRating" DROP CONSTRAINT "MatchRating_matchId_fkey";

-- DropForeignKey
ALTER TABLE "MatchRating" DROP CONSTRAINT "MatchRating_userId_fkey";

-- DropForeignKey
ALTER TABLE "WatchListItem" DROP CONSTRAINT "WatchListItem_userId_fkey";

-- AddForeignKey
ALTER TABLE "MatchRating" ADD CONSTRAINT "MatchRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRating" ADD CONSTRAINT "MatchRating_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListItem" ADD CONSTRAINT "WatchListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_wrestlerId_fkey" FOREIGN KEY ("wrestlerId") REFERENCES "Wrestler"("id") ON DELETE CASCADE ON UPDATE CASCADE;
