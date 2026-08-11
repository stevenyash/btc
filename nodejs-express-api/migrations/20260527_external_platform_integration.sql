-- --------------------------------------------------------

-- Table structure for table `platform_api_keys`
-- Stores API keys for external platforms to authenticate with the self-service API

CREATE TABLE `platform_api_keys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform_id` varchar(255) NOT NULL,
  `api_key` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Descriptive name for the key (e.g., "Production Key", "Test Key")',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` datetime NULL COMMENT 'Optional expiration date for the key',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_api_key` (`api_key`),
  KEY `idx_platform_id` (`platform_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

-- Table structure for table `platforms`
-- Stores information about external platforms that integrate with B2H

CREATE TABLE `platforms` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

-- Table structure for table `platform_actions`
-- Stores actions that external platforms can register for tracking conversions

CREATE TABLE `platform_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Unique identifier for the action (e.g., "BORROW_FROM_LIBRARY")',
  `display_name` varchar(255) NOT NULL COMMENT 'Human-readable name (e.g., "Borrow from Library")',
  `description` text NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether B2H admin has approved this action',
  `approved_at` datetime NULL COMMENT 'When the action was approved',
  `approved_by` int(11) NULL COMMENT 'User ID of the admin who approved',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_platform_action` (`platform_id`, `name`),
  KEY `idx_platform_id` (`platform_id`),
  KEY `idx_is_approved` (`is_approved`),
  CONSTRAINT `fk_platform_actions_platform` FOREIGN KEY (`platform_id`) REFERENCES `platforms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

-- Table structure for table `referral_rates`
-- Stores the referral rates for platform/tier/action combinations

CREATE TABLE `referral_rates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform_id` varchar(255) NOT NULL,
  `tier` varchar(50) NOT NULL DEFAULT 'DEFAULT' COMMENT 'User tier (e.g., DEFAULT, PREMIUM, etc.)',
  `action` varchar(255) NOT NULL COMMENT 'Action identifier (matches platform_actions.name)',
  `rate` decimal(10,2) NOT NULL COMMENT 'Reward amount in KES',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_platform_tier_action` (`platform_id`, `tier`, `action`),
  KEY `idx_platform_id` (`platform_id`),
  KEY `idx_action` (`action`),
  CONSTRAINT `fk_referral_rates_platform` FOREIGN KEY (`platform_id`) REFERENCES `platforms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

-- Insert a default platform for testing/example purposes
-- In a real scenario, platforms would be created via admin interface or API

INSERT INTO `platforms` (`id`, `name`, `description`) VALUES 
('example-platform', 'Example Platform', 'An example external platform for testing integration');

-- Insert API key for the example platform
-- In reality, this would be generated securely and shared with the platform
INSERT INTO `platform_api_keys` (`platform_id`, `api_key`, `name`) VALUES 
('example-platform', 'b2h_example_key_12345', 'Example Platform API Key');
