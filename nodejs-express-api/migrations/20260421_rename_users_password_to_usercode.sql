-- Migration: Rename users.password to users.usercode
-- Date: 2026-04-21

-- Rename password column to usercode
ALTER TABLE `users` CHANGE COLUMN `password` `usercode` VARCHAR(255) NULL;
