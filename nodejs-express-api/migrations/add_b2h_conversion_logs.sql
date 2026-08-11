-- Table structure for table `b2h_conversion_logs`
-- Stores B2H conversion webhook confirmations received from B2H platform

CREATE TABLE IF NOT EXISTS `b2h_conversion_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `referral_code` varchar(255) NOT NULL,
  `action` varchar(255) NOT NULL COMMENT 'B2H action name (e.g., SUBSCRIPTION_PURCHASE)',
  `platform_id` varchar(255) NOT NULL,
  `conversion_status` varchar(50) NOT NULL,
  `converted_at` datetime NOT NULL,
  `metadata` json NULL COMMENT 'Additional metadata from B2H',
  `raw_payload` text NULL COMMENT 'Raw webhook payload for debugging',
  `status` varchar(50) NOT NULL DEFAULT 'processed',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_referral_code` (`referral_code`),
  KEY `idx_action` (`action`),
  KEY `idx_platform_id` (`platform_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
