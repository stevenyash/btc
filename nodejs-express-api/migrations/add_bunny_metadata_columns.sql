-- Migration: Add Bunny metadata columns to lessons table
-- Adds columns for storing Bunny video metadata
-- Run: mysql -u username -p database_name < add_bunny_metadata_columns.sql

-- Add encode_progress column (INTEGER, default 0, nullable)
ALTER TABLE lessons
ADD COLUMN encode_progress INT DEFAULT 0 NULL AFTER is_active;

-- Add views column (INTEGER, default 0, nullable)
ALTER TABLE lessons
ADD COLUMN views INT DEFAULT 0 NULL AFTER encode_progress;

-- Add date_uploaded column (DATE, nullable)
ALTER TABLE lessons
ADD COLUMN date_uploaded DATE NULL AFTER views;

-- Add preview_url column (VARCHAR(255), nullable)
ALTER TABLE lessons
ADD COLUMN preview_url VARCHAR(255) NULL AFTER date_uploaded;

-- Add collection_id column (VARCHAR(255), nullable)
ALTER TABLE lessons
ADD COLUMN collection_id VARCHAR(255) NULL AFTER preview_url;

-- Verify the changes
DESCRIBE lessons;
