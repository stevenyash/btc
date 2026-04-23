-- Migration: Drop guest_users table
-- Date: 2026-04-21
-- Note: This table is no longer needed; guest tracking is now handled by guest_tracker table

DROP TABLE IF EXISTS `guest_users`;
