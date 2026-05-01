-- Add Bunny Stream fields to lessons table
-- Migration: Add video_id and transcoding status tracking

ALTER TABLE lessons 
ADD COLUMN bunny_video_id VARCHAR(100) NULL AFTER bunny_url,
ADD COLUMN transcoding_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' AFTER bunny_video_id,
ADD COLUMN mp4_urls JSON NULL AFTER transcoding_status,
ADD COLUMN video_guid VARCHAR(100) NULL AFTER mp4_urls;

-- Add index for faster lookups on bunny_video_id
CREATE INDEX idx_lessons_bunny_video_id ON lessons(bunny_video_id);

-- Add index for transcoding status queries
CREATE INDEX idx_lessons_transcoding_status ON lessons(transcoding_status);

-- Optional: Update existing records to mark transcoding as completed if they have bunny_url
-- Uncomment if needed:
-- UPDATE lessons SET transcoding_status = 'completed' WHERE bunny_url IS NOT NULL;
