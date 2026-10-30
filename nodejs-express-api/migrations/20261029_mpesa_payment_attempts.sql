CREATE TABLE IF NOT EXISTS `mpesa_payment_attempts` (
  `checkout_request_id` varchar(50) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `account_reference` varchar(100) NOT NULL,
  `business_metadata` json NOT NULL,
  `status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
  `activation_status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `transaction_id` varchar(50) DEFAULT NULL,
  `callback_amount` decimal(10,2) DEFAULT NULL,
  `callback_phone` varchar(15) DEFAULT NULL,
  `guest_session_key_hash` char(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`checkout_request_id`),
  KEY `idx_mpesa_attempt_phone_created` (`phone_number`,`created_at`),
  KEY `idx_mpesa_attempt_status_activation` (`status`,`activation_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
