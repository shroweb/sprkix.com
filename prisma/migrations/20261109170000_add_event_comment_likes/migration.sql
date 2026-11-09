-- CreateTable
CREATE TABLE "EventCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventCommentLike_commentId_userId_key" ON "EventCommentLike"("commentId", "userId");

-- CreateIndex
CREATE INDEX "EventCommentLike_userId_idx" ON "EventCommentLike"("userId");

-- AddForeignKey
ALTER TABLE "EventCommentLike" ADD CONSTRAINT "EventCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "EventComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCommentLike" ADD CONSTRAINT "EventCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
