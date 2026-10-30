CREATE TABLE IF NOT EXISTS `b2h_webhook_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_type` varchar(100) NOT NULL,
  `platform_id` varchar(255) NOT NULL,
  `event_timestamp` datetime NOT NULL,
  `payload` json NOT NULL,
  `raw_payload` text NOT NULL,
  `received_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_b2h_webhook_event_type` (`event_type`),
  KEY `idx_b2h_webhook_platform_id` (`platform_id`),
  KEY `idx_b2h_webhook_received_at` (`received_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
