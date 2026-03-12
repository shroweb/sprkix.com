-- CreateTable
CREATE TABLE "MatchRating" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchRating_matchId_userId_key" ON "MatchRating"("matchId", "userId");

-- AddForeignKey
ALTER TABLE "MatchRating" ADD CONSTRAINT "MatchRating_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRating" ADD CONSTRAINT "MatchRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
