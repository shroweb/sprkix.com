-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_eventId_fkey";

-- DropForeignKey
ALTER TABLE "WatchListItem" DROP CONSTRAINT "WatchListItem_eventId_fkey";

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListItem" ADD CONSTRAINT "WatchListItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
