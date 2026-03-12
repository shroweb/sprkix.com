-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "type" TEXT;

-- CreateTable
CREATE TABLE "WatchListItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchListItem_userId_eventId_key" ON "WatchListItem"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "WatchListItem" ADD CONSTRAINT "WatchListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchListItem" ADD CONSTRAINT "WatchListItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
