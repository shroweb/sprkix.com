-- AlterTable WatchListItem (idempotent)
DO $$ BEGIN
  ALTER TABLE "WatchListItem" ADD COLUMN "watchlist" BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
