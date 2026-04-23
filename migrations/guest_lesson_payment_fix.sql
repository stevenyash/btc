-- Migration: Fix guest lesson payment tables for pay-per-lesson flow
-- Date: 2026-04-21
-- Description: Optimize tables for unsubscribed guests paying and watching individual lessons

-- ============================================================
-- 1. Add missing columns to purchases table
-- ============================================================

ALTER TABLE purchases 
ADD COLUMN phone_number VARCHAR(15) DEFAULT NULL AFTER amount_paid,
ADD COLUMN lesson_id INT DEFAULT NULL AFTER package_id,
ADD COLUMN checkout_request_id VARCHAR(50) DEFAULT NULL AFTER phone_number;

-- Add index for fast guest lesson lookup
ALTER TABLE purchases ADD INDEX idx_purchases_phone_lesson (phone_number, lesson_id);

-- ============================================================
-- 2. Fix guest_tracker columns
-- ============================================================

ALTER TABLE guest_tracker 
MODIFY COLUMN lesson_id INT NOT NULL,
MODIFY COLUMN expires_at DATETIME DEFAULT NULL,
MODIFY COLUMN watchStart DATETIME DEFAULT NULL,
MODIFY COLUMN resumeTime INT DEFAULT 0 COMMENT 'Resume position in seconds',
MODIFY COLUMN timeViewTime INT DEFAULT 0 COMMENT 'Total watched time in seconds';

-- Rename columns (separate statements required)
ALTER TABLE guest_tracker CHANGE COLUMN timeViewTime total_watch_time INT DEFAULT 0 COMMENT 'Total watched time in seconds';
ALTER TABLE guest_tracker CHANGE COLUMN watchStart watch_started_at DATETIME DEFAULT NULL;

-- Add index for phone + lesson lookup
ALTER TABLE guest_tracker ADD INDEX idx_guest_tracker_phone_lesson (phone, lesson_id);

-- ============================================================
-- 3. Fix lesson_access_logs columns
-- ============================================================

ALTER TABLE lesson_access_logs 
MODIFY COLUMN lesson_id INT NOT NULL,
MODIFY COLUMN session_id VARCHAR(100) NOT NULL;

-- Add index for guest session lookup
ALTER TABLE lesson_access_logs ADD INDEX idx_lesson_access_logs_phone_status (phone, status, expires_at);

-- ============================================================
-- 4. Add guest_lesson_payments table (optional - for easier localStorage sync)
-- ============================================================

CREATE TABLE IF NOT EXISTS guest_lesson_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  lesson_id INT NOT NULL,
  checkout_request_id VARCHAR(50) NOT NULL,
  transaction_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  amount DECIMAL(10,2) DEFAULT NULL,
  paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone_lesson (phone, lesson_id),
  INDEX idx_checkout (checkout_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Fix lesson_track date columns
-- ============================================================

ALTER TABLE lesson_track 
MODIFY COLUMN last_accessed DATETIME DEFAULT NULL,
MODIFY COLUMN expires_at DATETIME DEFAULT NULL,
MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================================
-- 6. Update transactions table - add lesson_id for single lesson purchases
-- ============================================================

ALTER TABLE transactions
ADD COLUMN lesson_id INT DEFAULT NULL AFTER details_id;

-- ============================================================
-- 7. Create view for guest lesson payment status (optional)
-- ============================================================

CREATE OR REPLACE VIEW v_guest_lesson_access AS
SELECT 
  glp.phone,
  glp.lesson_id,
  glp.transaction_status,
  glp.paid_at,
  glp.expires_at,
  l.title as lesson_title,
  la.name as area_name
FROM guest_lesson_payments glp
LEFT JOIN lessons l ON l.id = glp.lesson_id
LEFT JOIN learning_areas la ON la.id = l.area_id
WHERE glp.transaction_status = 'completed';