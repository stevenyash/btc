-- Add Bunny.net columns to lessons table
-- These columns will be used alongside existing S3 columns during migration

ALTER TABLE lessons 
ADD COLUMN storage_path VARCHAR(500) NULL AFTER s3_url,
ADD COLUMN bunny_url VARCHAR(500) NULL AFTER storage_path;

-- Add index for faster lookups on storage_path
CREATE INDEX idx_lessons_storage_path ON lessons(storage_path);

-- Optional: Populate storage_path with s3_key values for existing records
-- Uncomment the line below if you want to copy existing s3_key values
-- UPDATE lessons SET storage_path = s3_key, bunny_url = s3_url WHERE s3_key IS NOT NULL;
