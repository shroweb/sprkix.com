-- Add query indexes for hot lookup paths
CREATE INDEX IF NOT EXISTS "Event_date_idx" ON "Event"("date");
CREATE INDEX IF NOT EXISTS "Event_promotion_idx" ON "Event"("promotion");

CREATE INDEX IF NOT EXISTS "Match_eventId_idx" ON "Match"("eventId");
CREATE INDEX IF NOT EXISTS "Match_championshipId_idx" ON "Match"("championshipId");

CREATE INDEX IF NOT EXISTS "MatchRating_userId_idx" ON "MatchRating"("userId");
CREATE INDEX IF NOT EXISTS "MatchRating_matchId_idx" ON "MatchRating"("matchId");

CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");
CREATE INDEX IF NOT EXISTS "Review_eventId_idx" ON "Review"("eventId");

CREATE INDEX IF NOT EXISTS "ReviewVote_userId_idx" ON "ReviewVote"("userId");
CREATE INDEX IF NOT EXISTS "ReviewVote_reviewId_idx" ON "ReviewVote"("reviewId");

CREATE INDEX IF NOT EXISTS "Reply_reviewId_idx" ON "Reply"("reviewId");
CREATE INDEX IF NOT EXISTS "Reply_userId_idx" ON "Reply"("userId");

CREATE INDEX IF NOT EXISTS "WatchListItem_userId_idx" ON "WatchListItem"("userId");
CREATE INDEX IF NOT EXISTS "WatchListItem_eventId_idx" ON "WatchListItem"("eventId");

CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");

CREATE INDEX IF NOT EXISTS "LiveComment_eventId_idx" ON "LiveComment"("eventId");
CREATE INDEX IF NOT EXISTS "LiveComment_userId_idx" ON "LiveComment"("userId");

CREATE INDEX IF NOT EXISTS "Prediction_userId_idx" ON "Prediction"("userId");
CREATE INDEX IF NOT EXISTS "Prediction_matchId_idx" ON "Prediction"("matchId");

CREATE INDEX IF NOT EXISTS "Follow_followingId_idx" ON "Follow"("followingId");

CREATE INDEX IF NOT EXISTS "ListItem_listId_idx" ON "ListItem"("listId");

CREATE INDEX IF NOT EXISTS "PollVote_pollId_idx" ON "PollVote"("pollId");

-- The UserBadge table never made it into a migration (schema was synced via
-- db push before the model existed) — create it idempotently for DBs that
-- drifted, then index it.
CREATE TABLE IF NOT EXISTS "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "UserBadge_userId_idx" ON "UserBadge"("userId");
CREATE INDEX IF NOT EXISTS "UserBadge_badgeType_idx" ON "UserBadge"("badgeType");

CREATE INDEX IF NOT EXISTS "PushToken_userId_idx" ON "PushToken"("userId");

CREATE INDEX IF NOT EXISTS "EventSubmission_status_idx" ON "EventSubmission"("status");

CREATE INDEX IF NOT EXISTS "WrestlerAlias_alias_idx" ON "WrestlerAlias"("alias");

-- Full-text search support: pg_trgm accelerates ILIKE '%term%' queries
-- used by the /api/search route on events, wrestlers, aliases, users, and news.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Event_title_trgm_idx" ON "Event" USING gin ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Event_promotion_trgm_idx" ON "Event" USING gin ("promotion" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Wrestler_name_trgm_idx" ON "Wrestler" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "WrestlerAlias_alias_trgm_idx" ON "WrestlerAlias" USING gin ("alias" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_name_trgm_idx" ON "User" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "NewsPost_title_trgm_idx" ON "NewsPost" USING gin ("title" gin_trgm_ops);

-- DB-backed rate limiting (login, chat, votes, submissions)
CREATE TABLE IF NOT EXISTS "RateLimitEntry" (
    "key" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("key")
);

-- Admin action audit log
CREATE TABLE IF NOT EXISTS "AdminLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AdminLog_action_idx" ON "AdminLog"("action");

ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;