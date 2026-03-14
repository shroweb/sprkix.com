#!/bin/bash
set -e

echo "→ Prisma: generating client..."
npx prisma generate

echo "→ Prisma: baselining historical migrations..."
# These migrations were applied manually before migration tracking was set up.
# We mark them as applied so Prisma skips their SQL and only runs new ones.
BASELINE=(
  20250524132545_init
  20250524133845_add_image_url
  20250524140145_add_event_model
  20250524150816_add_match_model
  20250524160704_add_profightdb_url
  20250524162750_add_event_matches_relation
  20250524163358_add_match_details
  20250524180121_update_match_model
  20250524183022_add_match_fields
  20250524203711_add_event_description
  20250524205820_add_profightdburl
  20250524214244_add_user_model
  20250524223918_add_review_model
  20250524230254_add_user_role
  20250525111925_add_tmdb_id
  20250525123858_update_cascade
  20250525125053_add_tmdbid
  20250526135130_add_watchlist
  20250526163231_add_replies
  20250527191218_add_review_like
  20250527210020_add_slug_to_user
  20250527210350_add_slug_unique_constraint
  20250527213136_add_follow_model
  20250529193705_add_match_wrestler_models
  20250529224746_add_is_admin
  20250530204101_add_match_ratings
  20250530205251_match_ratings
  20250601175829_enable_cascade_delete
  20250601180850_fix_ondelete_cascade
)

for migration in "${BASELINE[@]}"; do
  # A failed migration must be rolled-back before it can be marked applied.
  # Both commands are no-ops if the migration is already in the right state.
  npx prisma migrate resolve --rolled-back "$migration" 2>&1 || true
  npx prisma migrate resolve --applied "$migration" 2>&1 || true
done

echo "→ Prisma: resetting any previously-failed new migrations..."
# If a prior deploy attempt ran these and left them in failed state,
# roll them back so migrate deploy can re-run them cleanly.
for migration in 20260312112122_init 20260313214500_add_watchlist_flag 20260314000000_add_features; do
  npx prisma migrate resolve --rolled-back "$migration" 2>&1 || true
done

echo "→ Prisma: deploying new migrations..."
npx prisma migrate deploy

echo "→ Done."
