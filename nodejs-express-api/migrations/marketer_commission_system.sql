-- Marketer Commission & Redemption System Migration
-- Run this script to add commission tracking and points redemption to the marketer system

-- 1. Add commission fields to marketers table
ALTER TABLE marketers ADD COLUMN commission_rate DECIMAL(5,4) DEFAULT 0.10;
ALTER TABLE marketers ADD COLUMN total_earnings DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE marketers ADD COLUMN pending_earnings DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE marketers ADD COLUMN withdrawn_earnings DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE marketers ADD COLUMN redeemed_points INT DEFAULT 0;

-- 2. Create marketer_commissions table
CREATE TABLE IF NOT EXISTS marketer_commissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  marketer_id INT NOT NULL,
  user_id INT NOT NULL,
  transaction_id INT,
  purchase_type ENUM('subscription', 'package', 'tutorial') NOT NULL,
  purchase_amount DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'approved', 'paid') DEFAULT 'approved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (marketer_id) REFERENCES marketers(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- 3. Create marketer_point_redemptions table
CREATE TABLE IF NOT EXISTS marketer_point_redemptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  marketer_id INT NOT NULL,
  points_redeemed INT NOT NULL,
  point_value DECIMAL(12,2) NOT NULL,
  cash_amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  remarks TEXT,
  reviewed_by INT,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (marketer_id) REFERENCES marketers(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- 4. Create marketer_withdrawals table
CREATE TABLE IF NOT EXISTS marketer_withdrawals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  marketer_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  source ENUM('commission', 'points', 'both') DEFAULT 'both',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  mpesa_receipt VARCHAR(50),
  mpesa_conversation_id VARCHAR(100),
  mpesa_originator_conversation_id VARCHAR(100),
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (marketer_id) REFERENCES marketers(id)
);

-- 5. Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(500) NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Seed default settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('default_commission_rate', '0.10', 'Default commission rate for marketers (10%)'),
('point_value', '10.00', 'Monetary value per point in KES'),
('min_withdrawal_amount', '100.00', 'Minimum withdrawal amount in KES'),
('min_points_redemption', '10', 'Minimum points required for redemption');
