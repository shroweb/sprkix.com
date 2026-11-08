-- CreateTable
CREATE TABLE "LinealTitle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'title',
    "emoji" TEXT,
    "origin" TEXT,
    "allowMultiMan" BOOLEAN NOT NULL DEFAULT false,
    "requireClean" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinealTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinealReign" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "wrestlerId" TEXT NOT NULL,
    "reignNumber" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "startMatchId" TEXT,
    "endMatchId" TEXT,
    "defences" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinealReign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinealTitle_slug_key" ON "LinealTitle"("slug");

-- CreateIndex
CREATE INDEX "LinealReign_titleId_startedAt_idx" ON "LinealReign"("titleId", "startedAt");

-- CreateIndex
CREATE INDEX "LinealReign_wrestlerId_idx" ON "LinealReign"("wrestlerId");

-- AddForeignKey
ALTER TABLE "LinealReign" ADD CONSTRAINT "LinealReign_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "LinealTitle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinealReign" ADD CONSTRAINT "LinealReign_wrestlerId_fkey" FOREIGN KEY ("wrestlerId") REFERENCES "Wrestler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

