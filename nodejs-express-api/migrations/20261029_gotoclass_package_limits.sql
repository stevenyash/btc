ALTER TABLE `packages`
  ADD COLUMN `watch_time_minutes` int(11) NOT NULL DEFAULT 0;

UPDATE `packages` p
SET p.`watch_time_minutes` = p.`no_of_lessons` * COALESCE(
  (SELECT CAST(ls.`duration` AS UNSIGNED)
   FROM `lesson_setting` ls
   WHERE ls.`subscription_type` = 'subscribed'
   ORDER BY ls.`id` DESC
   LIMIT 1),
  90
)
WHERE p.`watch_time_minutes` = 0;

ALTER TABLE `lesson_track`
  ADD COLUMN `total_watch_time_seconds` bigint unsigned NOT NULL DEFAULT 0,
  ADD COLUMN `remaining_watch_time_seconds` bigint unsigned NOT NULL DEFAULT 0;

UPDATE `lesson_track` lt
LEFT JOIN `packages` p ON p.`id` = lt.`package_id`
SET
  lt.`total_watch_time_seconds` = COALESCE(
    p.`watch_time_minutes`,
    lt.`total_lessons` * COALESCE(
      (SELECT CAST(ls.`duration` AS UNSIGNED)
       FROM `lesson_setting` ls
       WHERE ls.`subscription_type` = 'subscribed'
       ORDER BY ls.`id` DESC
       LIMIT 1),
      90
    )
  ) * 60,
  lt.`remaining_watch_time_seconds` = LEAST(
    COALESCE(
      p.`watch_time_minutes`,
      lt.`total_lessons` * COALESCE(
        (SELECT CAST(ls.`duration` AS UNSIGNED)
         FROM `lesson_setting` ls
         WHERE ls.`subscription_type` = 'subscribed'
         ORDER BY ls.`id` DESC
         LIMIT 1),
        90
      )
    ),
    lt.`lesson_balance` * COALESCE(
      (SELECT CAST(ls.`duration` AS UNSIGNED)
       FROM `lesson_setting` ls
       WHERE ls.`subscription_type` = 'subscribed'
       ORDER BY ls.`id` DESC
       LIMIT 1),
      90
    )
  ) * 60
WHERE lt.`total_watch_time_seconds` = 0;

ALTER TABLE `guest_lesson_payments`
  ADD COLUMN `watch_time_limit_seconds` int unsigned NOT NULL DEFAULT 0,
  ADD COLUMN `watch_time_used_seconds` int unsigned NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS `lesson_access_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `lesson_id` int(11) NOT NULL,
  `access_type` enum('guest','subscriber','subscriber_resumed','preview') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_id` varchar(100) NOT NULL,
  `expires_at` datetime NOT NULL,
  `accessed_at` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `watch_time` int(10) unsigned DEFAULT 0,
  `completion_percentage` decimal(5,2) DEFAULT 0.00,
  `guest_tracker_id` int(11) DEFAULT NULL,
  `lesson_track_id` int(11) DEFAULT NULL,
  `lesson_setting_id` int(11) DEFAULT NULL,
  `status` enum('active','completed','expired','cancelled') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_id` (`session_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_access_type` (`access_type`),
  KEY `idx_guest_tracker_id` (`guest_tracker_id`),
  KEY `idx_lesson_track_id` (`lesson_track_id`),
  KEY `idx_accessed_at` (`accessed_at`),
  KEY `idx_lesson_access_logs_phone_status` (`phone`,`status`,`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE `guest_lesson_payments` glp
LEFT JOIN (
  SELECT `phone`, `lesson_id`, MAX(`watch_time`) AS `watch_time`
  FROM `lesson_access_logs`
  GROUP BY `phone`, `lesson_id`
) wal ON wal.`phone` = glp.`phone` AND wal.`lesson_id` = glp.`lesson_id`
SET
  glp.`watch_time_limit_seconds` = COALESCE(
    (SELECT CAST(ls.`duration` AS UNSIGNED) * 60
     FROM `lesson_setting` ls
     WHERE ls.`subscription_type` = 'non_subscribed'
     ORDER BY ls.`id` DESC
     LIMIT 1),
    5400
  ),
  glp.`watch_time_used_seconds` = LEAST(
    COALESCE(
      (SELECT CAST(ls.`duration` AS UNSIGNED) * 60
       FROM `lesson_setting` ls
       WHERE ls.`subscription_type` = 'non_subscribed'
       ORDER BY ls.`id` DESC
       LIMIT 1),
      5400
    ),
    COALESCE(wal.`watch_time`, 0)
  )
WHERE glp.`watch_time_limit_seconds` = 0;

CREATE TABLE IF NOT EXISTS `subscription_lesson_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lesson_track_id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `first_watched_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subscription_lesson_usage` (`subscription_id`, `lesson_id`),
  KEY `idx_subscription_lesson_usage_track` (`lesson_track_id`),
  KEY `idx_subscription_lesson_usage_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `subscription_lesson_usage`
  (`lesson_track_id`, `subscription_id`, `user_id`, `lesson_id`, `first_watched_at`)
SELECT DISTINCT
  lt.`id`, lt.`subscription_id`, lt.`user_id`, lal.`lesson_id`,
  COALESCE(MIN(lal.`accessed_at`), lt.`created_at`)
FROM `lesson_track` lt
JOIN `lesson_access_logs` lal
  ON lal.`user_id` = lt.`user_id`
 AND lal.`lesson_track_id` = lt.`id`
WHERE lal.`watch_time` > 0
GROUP BY lt.`id`, lt.`subscription_id`, lt.`user_id`, lal.`lesson_id`;

UPDATE `lesson_track` lt
LEFT JOIN (
  SELECT `subscription_id`, COUNT(*) AS `lessons_used`
  FROM `subscription_lesson_usage`
  GROUP BY `subscription_id`
) usage_count ON usage_count.`subscription_id` = lt.`subscription_id`
SET
  lt.`lessons_viewed` = COALESCE(usage_count.`lessons_used`, 0),
  lt.`lesson_balance` = GREATEST(
    0,
    lt.`total_lessons` - COALESCE(usage_count.`lessons_used`, 0)
  );

CREATE TABLE IF NOT EXISTS `subscription_device_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `device_id` varchar(128) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `last_heartbeat_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subscription_device` (`user_id`, `device_id`),
  KEY `idx_subscription_device_heartbeat` (`user_id`, `last_heartbeat_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
