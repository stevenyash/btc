-- Ensure lessons has the columns used by Bunny Stream sync.
-- Select the production database before running this migration.
-- Safe to rerun: existing columns and indexes are left unchanged.

SET @schema_name = DATABASE();

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'storage_path') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `storage_path` VARCHAR(500) NULL',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'bunny_url') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `bunny_url` VARCHAR(500) NULL',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'bunny_video_id') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `bunny_video_id` VARCHAR(100) NULL',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'transcoding_status') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `transcoding_status` ENUM(''pending'', ''processing'', ''completed'', ''failed'') NOT NULL DEFAULT ''pending''',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'mp4_urls') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `mp4_urls` JSON NULL',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'video_guid') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `video_guid` VARCHAR(100) NULL',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'encode_progress') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `encode_progress` INT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'views') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `views` INT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'date_uploaded') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `date_uploaded` DATETIME NULL',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'preview_url') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `preview_url` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND column_name = 'collection_id') = 0,
  'ALTER TABLE `lessons` ADD COLUMN `collection_id` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND index_name = 'idx_lessons_bunny_video_id') = 0,
  'CREATE INDEX `idx_lessons_bunny_video_id` ON `lessons` (`bunny_video_id`)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND index_name = 'idx_lessons_storage_path') = 0,
  'CREATE INDEX `idx_lessons_storage_path` ON `lessons` (`storage_path`)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = @schema_name AND table_name = 'lessons' AND index_name = 'idx_lessons_transcoding_status') = 0,
  'CREATE INDEX `idx_lessons_transcoding_status` ON `lessons` (`transcoding_status`)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

-- Verify the Bunny columns after migration.
SELECT column_name, column_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = @schema_name
  AND table_name = 'lessons'
  AND column_name IN (
    'storage_path',
    'bunny_url',
    'bunny_video_id',
    'transcoding_status',
    'mp4_urls',
    'video_guid',
    'encode_progress',
    'views',
    'date_uploaded',
    'preview_url',
    'collection_id'
  )
ORDER BY ordinal_position;
