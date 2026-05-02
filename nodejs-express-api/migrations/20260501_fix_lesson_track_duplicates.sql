-- Migration: Fix lesson_track duplicates and add unique constraint
-- Date: 2026-05-01
-- Description: Removes duplicate (user_id, subscription_id) entries, keeping the most recent, then adds unique index

-- Step 1: Identify duplicates and keep only the latest record per (user_id, subscription_id)
-- This uses a temporary table to store the IDs to keep
CREATE TEMPORARY TABLE tmp_lesson_track_keep AS
SELECT MAX(id) as id
FROM lesson_track
GROUP BY user_id, subscription_id;

-- Step 2: Delete duplicates that are NOT in the keep list
DELETE FROM lesson_track
WHERE id NOT IN (SELECT id FROM tmp_lesson_track_keep);

-- Drop temporary table
DROP TEMPORARY TABLE tmp_lesson_track_keep;

-- Step 3: Now add the unique constraint (this should succeed after deduplication)
ALTER TABLE `lesson_track`
ADD UNIQUE INDEX `lesson_track_user_id_subscription_id` (`user_id`, `subscription_id`);
