-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 21, 2026 at 05:54 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `btc`
--

-- --------------------------------------------------------

--
-- Table structure for table `about_us`
--

CREATE TABLE `about_us` (
  `id` int(11) NOT NULL,
  `section` varchar(255) NOT NULL,
  `content` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `active_subscriptions`
--

CREATE TABLE `active_subscriptions` (
  `id` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `image` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `subscription_code` varchar(50) DEFAULT NULL,
  `referred_by` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assign_rights`
--

CREATE TABLE `assign_rights` (
  `id` int(11) NOT NULL,
  `permission` varchar(50) NOT NULL,
  `description` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_us`
--

CREATE TABLE `contact_us` (
  `id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `detail` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expired_subscriptions`
--

CREATE TABLE `expired_subscriptions` (
  `id` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `image` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `subscription_code` varchar(50) DEFAULT NULL,
  `referred_by` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grades`
--

CREATE TABLE `grades` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `description` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `level_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guest_lesson_payments`
--

CREATE TABLE `guest_lesson_payments` (
  `id` int(11) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `checkout_request_id` varchar(50) NOT NULL,
  `transaction_status` enum('pending','completed','failed') DEFAULT 'pending',
  `amount` decimal(10,2) DEFAULT NULL,
  `paid_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guest_tracker`
--

CREATE TABLE `guest_tracker` (
  `id` int(11) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `fingerPrint` longtext DEFAULT NULL,
  `watch_started_at` datetime DEFAULT NULL,
  `resumeTime` int(11) DEFAULT 0 COMMENT 'Resume position in seconds',
  `total_watch_time` int(11) DEFAULT 0 COMMENT 'Total watched time in seconds',
  `status` varchar(50) DEFAULT NULL,
  `lesson_id` int(11) NOT NULL,
  `transaction_id` varchar(50) DEFAULT NULL,
  `views_count` int(11) NOT NULL DEFAULT 0,
  `last_accessed` varchar(50) DEFAULT NULL,
  `created_at` varchar(50) DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL,
  `updated_at` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guest_users`
--

CREATE TABLE `guest_users` (
  `id` int(11) NOT NULL,
  `guest_id` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `fingerprint` longtext DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `platiform` varchar(1000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invites`
--

CREATE TABLE `invites` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `invitee_email` varchar(50) DEFAULT NULL,
  `invitee_phone` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `referral_code` varchar(50) DEFAULT NULL,
  `invitee_join_date` datetime DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `learning_areas`
--

CREATE TABLE `learning_areas` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#1976D2',
  `icon` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `grade_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `learning_levels`
--

CREATE TABLE `learning_levels` (
  `level_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lessons`
--

CREATE TABLE `lessons` (
  `id` int(11) NOT NULL,
  `area_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `s3_key` varchar(500) DEFAULT NULL,
  `s3_url` varchar(500) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `duration` int(11) DEFAULT 0,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `is_preview_available` tinyint(1) DEFAULT 0,
  `preview_duration` int(11) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `subtopic_id` int(11) NOT NULL,
  `topic_id` int(11) NOT NULL,
  `file` varchar(50) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `primary_thumbnail` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_access_logs`
--

CREATE TABLE `lesson_access_logs` (
  `id` int(11) NOT NULL,
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
  `watch_time` int(10) UNSIGNED DEFAULT 0 COMMENT 'Total watch time in seconds',
  `completion_percentage` decimal(5,2) DEFAULT 0.00 COMMENT 'Percentage of video watched',
  `guest_tracker_id` int(11) DEFAULT NULL,
  `lesson_track_id` int(11) DEFAULT NULL,
  `lesson_setting_id` int(11) DEFAULT NULL,
  `status` enum('active','completed','expired','cancelled') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_setting`
--

CREATE TABLE `lesson_setting` (
  `id` int(11) NOT NULL,
  `fee` varchar(50) DEFAULT NULL,
  `duration` varchar(50) NOT NULL,
  `subscription_type` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_track`
--

CREATE TABLE `lesson_track` (
  `id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `lessons_viewed` int(11) NOT NULL DEFAULT 0,
  `lesson_balance` int(11) NOT NULL,
  `total_lessons` int(11) NOT NULL,
  `package_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `last_accessed` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `marketers`
--

CREATE TABLE `marketers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `referral_code` varchar(255) DEFAULT NULL,
  `points` int(11) DEFAULT 0,
  `join_date` datetime DEFAULT NULL,
  `commission_rate` decimal(5,4) DEFAULT 0.1000,
  `total_earnings` decimal(12,2) DEFAULT 0.00,
  `pending_earnings` decimal(12,2) DEFAULT 0.00,
  `withdrawn_earnings` decimal(12,2) DEFAULT 0.00,
  `redeemed_points` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `marketer_commissions`
--

CREATE TABLE `marketer_commissions` (
  `id` int(11) NOT NULL,
  `marketer_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `purchase_type` enum('subscription','package','tutorial') NOT NULL,
  `purchase_amount` decimal(12,2) NOT NULL,
  `commission_rate` decimal(5,4) NOT NULL,
  `commission_amount` decimal(12,2) NOT NULL,
  `status` enum('pending','approved','paid') DEFAULT 'approved',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `marketer_point_redemptions`
--

CREATE TABLE `marketer_point_redemptions` (
  `id` int(11) NOT NULL,
  `marketer_id` int(11) NOT NULL,
  `points_redeemed` int(11) NOT NULL,
  `point_value` decimal(12,2) NOT NULL,
  `cash_amount` decimal(12,2) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `remarks` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `marketer_withdrawals`
--

CREATE TABLE `marketer_withdrawals` (
  `id` int(11) NOT NULL,
  `marketer_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `source` enum('commission','points','both') DEFAULT 'both',
  `status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `mpesa_receipt` varchar(50) DEFAULT NULL,
  `mpesa_conversation_id` varchar(100) DEFAULT NULL,
  `mpesa_originator_conversation_id` varchar(100) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `processed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `monthly_subscription_summary`
--

CREATE TABLE `monthly_subscription_summary` (
  `month` varchar(7) DEFAULT NULL,
  `total_subscriptions` bigint(21) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `newsletter_subscribers`
--

CREATE TABLE `newsletter_subscribers` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `subscribed_at` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('subscribed','unsubscribed') DEFAULT 'subscribed',
  `phone` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `packages`
--

CREATE TABLE `packages` (
  `id` int(11) NOT NULL,
  `subscription_type_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `no_of_lessons` int(11) NOT NULL,
  `fee` decimal(10,2) NOT NULL,
  `concurrent_access` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `duration_amount` int(11) NOT NULL,
  `duration_unit` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `permission_id` int(11) NOT NULL,
  `permission` varchar(255) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `package_id` int(11) NOT NULL,
  `lesson_id` int(11) DEFAULT NULL,
  `transaction_date` datetime DEFAULT current_timestamp(),
  `transaction_status` enum('pending','success','failed') DEFAULT 'pending',
  `payment_reference` varchar(255) DEFAULT NULL,
  `amount_paid` decimal(10,2) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `checkout_request_id` varchar(50) DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `question_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `status` enum('unanswered','answered') DEFAULT 'unanswered',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `scheduler_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referral_logs`
--

CREATE TABLE `referral_logs` (
  `id` int(11) NOT NULL,
  `marketer_id` int(11) DEFAULT NULL,
  `referred_user_email` varchar(255) DEFAULT NULL,
  `status` enum('CLICKED','SIGNED_UP') DEFAULT 'CLICKED',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rightslist`
--

CREATE TABLE `rightslist` (
  `user_id` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `image` varchar(50) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `role_name` varchar(255) DEFAULT NULL,
  `permission_id` int(11) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `permission` varchar(50) DEFAULT NULL,
  `has_right` int(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL,
  `list` int(11) NOT NULL DEFAULT 1,
  `edit` int(11) NOT NULL DEFAULT 1,
  `remove` int(11) NOT NULL DEFAULT 1,
  `view` int(11) NOT NULL DEFAULT 1,
  `role_id` int(11) NOT NULL DEFAULT 1,
  `page` varchar(255) NOT NULL DEFAULT '',
  `store` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scheduler`
--

CREATE TABLE `scheduler` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `grade` varchar(50) DEFAULT NULL,
  `learning_area` varchar(50) DEFAULT NULL,
  `strand` varchar(50) DEFAULT NULL,
  `start_date` varchar(50) DEFAULT NULL,
  `end_date` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `link` varchar(50) DEFAULT NULL,
  `meetingId` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `services_settings`
--

CREATE TABLE `services_settings` (
  `id` int(11) NOT NULL,
  `level` varchar(50) DEFAULT NULL,
  `title` varchar(50) DEFAULT NULL,
  `description` varchar(10000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscriber_tracker`
--

CREATE TABLE `subscriber_tracker` (
  `id` int(11) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `fingerPrint` varchar(500) DEFAULT NULL,
  `resumeTime` varchar(50) DEFAULT current_timestamp(),
  `timeViewTime` varchar(50) DEFAULT '0',
  `status` varchar(50) DEFAULT NULL,
  `lesson_id` varchar(50) NOT NULL,
  `transaction_id` varchar(50) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `watchStart` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `subscription_type_id` int(11) DEFAULT NULL,
  `subscription_code` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `transaction_id` int(11) NOT NULL,
  `phone_no` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `subscriptions_by_type`
-- (See below for the actual view)
--
CREATE TABLE `subscriptions_by_type` (
`subscription_type_id` int(11)
,`name` varchar(255)
,`description` text
,`membership_fee` decimal(10,2)
,`months` varchar(11)
,`total_subscriptions` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `subscriptions_per_user`
-- (See below for the actual view)
--
CREATE TABLE `subscriptions_per_user` (
`id` int(11)
,`username` varchar(50)
,`phone` varchar(50)
,`email` varchar(50)
,`total_subscriptions` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `subscriptions_renewal`
-- (See below for the actual view)
--
CREATE TABLE `subscriptions_renewal` (
`id` int(11)
,`username` varchar(50)
,`phone` varchar(50)
,`subscription_code` varchar(50)
,`expiry_date` datetime
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `subscription_status_distribution`
-- (See below for the actual view)
--
CREATE TABLE `subscription_status_distribution` (
`status` varchar(50)
,`total` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `subscription_types`
--

CREATE TABLE `subscription_types` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `membership_fee` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `months` varchar(11) NOT NULL DEFAULT '12'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subtopics`
--

CREATE TABLE `subtopics` (
  `subtopic_id` int(11) NOT NULL,
  `topic_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `topics`
--

CREATE TABLE `topics` (
  `topic_id` int(11) NOT NULL,
  `area_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT 0,
  `phone_number` varchar(15) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_reference` varchar(50) DEFAULT NULL,
  `checkout_request_id` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `description` text DEFAULT NULL,
  `response_code` varchar(10) DEFAULT NULL,
  `response_description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `transactionDate` varchar(50) DEFAULT NULL,
  `payment_status` varchar(50) NOT NULL DEFAULT 'waiting proccess',
  `details_id` varchar(50) NOT NULL,
  `lesson_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tutorials_settings`
--

CREATE TABLE `tutorials_settings` (
  `id` int(11) NOT NULL,
  `fee` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tutorial_register`
--

CREATE TABLE `tutorial_register` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `transaction_date` varchar(50) DEFAULT current_timestamp(),
  `transaction_status` varchar(50) NOT NULL,
  `payment_reference` varchar(50) NOT NULL,
  `amount_paid` int(11) NOT NULL,
  `expiry_date` varchar(50) NOT NULL,
  `tutorial_id` int(11) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `usercode` varchar(255) DEFAULT NULL,
  `image` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `account_status` varchar(50) DEFAULT 'Active',
  `user_role_id` int(11) DEFAULT NULL,
  `nhif` varchar(50) DEFAULT NULL,
  `nssf` varchar(50) DEFAULT NULL,
  `national_id` varchar(50) DEFAULT NULL,
  `subscription_code` varchar(50) DEFAULT NULL,
  `status` varchar(59) DEFAULT NULL,
  `referred_by` varchar(50) DEFAULT NULL,
  `subscription_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_activity`
--

CREATE TABLE `user_activity` (
  `activity_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `fingerprint` longtext DEFAULT NULL,
  `session_duration` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT NULL,
  `activity_type` enum('login','logout') DEFAULT NULL,
  `activity_time` timestamp NULL DEFAULT current_timestamp(),
  `platiform` varchar(1000) DEFAULT NULL,
  `device` varchar(50) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_guide`
--

CREATE TABLE `user_guide` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `icon` varchar(50) DEFAULT 'info',
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_privileges`
--

CREATE TABLE `user_privileges` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'User ID who receives the privilege',
  `privilege` varchar(255) NOT NULL COMMENT 'The privilege/permission granted',
  `granted_by` int(11) NOT NULL COMMENT 'User ID of the Super Admin who granted this privilege',
  `granted_at` datetime DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Whether this privilege is currently active',
  `expires_at` datetime DEFAULT NULL COMMENT 'Optional expiration date for temporary privileges'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User-specific privileges granted by Super Admin';

-- --------------------------------------------------------

--
-- Table structure for table `videos`
--

CREATE TABLE `videos` (
  `id` int(11) NOT NULL,
  `file` varchar(50) DEFAULT NULL,
  `collection` varchar(50) DEFAULT NULL,
  `visibility` varchar(50) DEFAULT NULL,
  `filename` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `description` varchar(50) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `title` varchar(50) DEFAULT NULL,
  `s3_key` varchar(500) DEFAULT NULL,
  `s3_url` varchar(500) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT NULL,
  `upload_error` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_guest_lesson_access`
-- (See below for the actual view)
--
CREATE TABLE `v_guest_lesson_access` (
`phone` varchar(15)
,`lesson_id` int(11)
,`transaction_status` enum('pending','completed','failed')
,`paid_at` datetime
,`expires_at` datetime
,`lesson_title` varchar(255)
,`area_name` varchar(50)
);

-- --------------------------------------------------------

--
-- Structure for view `subscriptions_by_type`
--
DROP TABLE IF EXISTS `subscriptions_by_type`;

CREATE ALGORITHM=UNDEFINED DEFINER=`bitstuto_newbtc`@`localhost` SQL SECURITY DEFINER VIEW `subscriptions_by_type`  AS SELECT `s`.`subscription_type_id` AS `subscription_type_id`, `st`.`name` AS `name`, `st`.`description` AS `description`, `st`.`membership_fee` AS `membership_fee`, `st`.`months` AS `months`, count(`s`.`id`) AS `total_subscriptions` FROM (`subscriptions` `s` join `subscription_types` `st` on(`s`.`subscription_type_id` = `st`.`id`)) GROUP BY `s`.`subscription_type_id`, `st`.`name`, `st`.`description`, `st`.`membership_fee`, `st`.`months` ;

-- --------------------------------------------------------

--
-- Structure for view `subscriptions_per_user`
--
DROP TABLE IF EXISTS `subscriptions_per_user`;

CREATE ALGORITHM=UNDEFINED DEFINER=`bitstuto_newbtc`@`localhost` SQL SECURITY DEFINER VIEW `subscriptions_per_user`  AS SELECT `u`.`id` AS `id`, `u`.`username` AS `username`, `u`.`phone` AS `phone`, `u`.`email` AS `email`, count(`s`.`id`) AS `total_subscriptions` FROM (`subscriptions` `s` join `users` `u` on(`s`.`user_id` = `u`.`id`)) GROUP BY `u`.`id`, `u`.`username`, `u`.`phone`, `u`.`email` ;

-- --------------------------------------------------------

--
-- Structure for view `subscriptions_renewal`
--
DROP TABLE IF EXISTS `subscriptions_renewal`;

CREATE ALGORITHM=UNDEFINED DEFINER=`bitstuto_newbtc`@`localhost` SQL SECURITY DEFINER VIEW `subscriptions_renewal`  AS SELECT `s`.`id` AS `id`, `u`.`username` AS `username`, `u`.`phone` AS `phone`, `s`.`subscription_code` AS `subscription_code`, `s`.`expiry_date` AS `expiry_date` FROM (`subscriptions` `s` join `users` `u` on(`s`.`user_id` = `u`.`id`)) WHERE `s`.`expiry_date` between current_timestamp() and current_timestamp() + interval 7 day ;

-- --------------------------------------------------------

--
-- Structure for view `subscription_status_distribution`
--
DROP TABLE IF EXISTS `subscription_status_distribution`;

CREATE ALGORITHM=UNDEFINED DEFINER=`bitstuto_newbtc`@`localhost` SQL SECURITY DEFINER VIEW `subscription_status_distribution`  AS SELECT `s`.`status` AS `status`, count(`s`.`id`) AS `total` FROM `subscriptions` AS `s` GROUP BY `s`.`status` ;

-- --------------------------------------------------------

--
-- Structure for view `v_guest_lesson_access`
--
DROP TABLE IF EXISTS `v_guest_lesson_access`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_guest_lesson_access`  AS SELECT `glp`.`phone` AS `phone`, `glp`.`lesson_id` AS `lesson_id`, `glp`.`transaction_status` AS `transaction_status`, `glp`.`paid_at` AS `paid_at`, `glp`.`expires_at` AS `expires_at`, `l`.`title` AS `lesson_title`, `la`.`name` AS `area_name` FROM ((`guest_lesson_payments` `glp` left join `lessons` `l` on(`l`.`id` = `glp`.`lesson_id`)) left join `learning_areas` `la` on(`la`.`id` = `l`.`area_id`)) WHERE `glp`.`transaction_status` = 'completed' ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `about_us`
--
ALTER TABLE `about_us`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `assign_rights`
--
ALTER TABLE `assign_rights`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_us`
--
ALTER TABLE `contact_us`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `grades`
--
ALTER TABLE `grades`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `guest_lesson_payments`
--
ALTER TABLE `guest_lesson_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_phone_lesson` (`phone`,`lesson_id`),
  ADD KEY `idx_checkout` (`checkout_request_id`);

--
-- Indexes for table `guest_tracker`
--
ALTER TABLE `guest_tracker`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_guest_tracker_phone_lesson` (`phone`,`lesson_id`);

--
-- Indexes for table `guest_users`
--
ALTER TABLE `guest_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `guest_id` (`guest_id`);

--
-- Indexes for table `invites`
--
ALTER TABLE `invites`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `learning_areas`
--
ALTER TABLE `learning_areas`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `learning_levels`
--
ALTER TABLE `learning_levels`
  ADD PRIMARY KEY (`level_id`);

--
-- Indexes for table `lessons`
--
ALTER TABLE `lessons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_area` (`area_id`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `lesson_access_logs`
--
ALTER TABLE `lesson_access_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_session_id` (`session_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_access_type` (`access_type`),
  ADD KEY `idx_guest_tracker_id` (`guest_tracker_id`),
  ADD KEY `idx_lesson_track_id` (`lesson_track_id`),
  ADD KEY `idx_accessed_at` (`accessed_at`),
  ADD KEY `idx_lesson_access_logs_phone_status` (`phone`,`status`,`expires_at`);

--
-- Indexes for table `lesson_setting`
--
ALTER TABLE `lesson_setting`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lesson_track`
--
ALTER TABLE `lesson_track`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `marketers`
--
ALTER TABLE `marketers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `referral_code` (`referral_code`);

--
-- Indexes for table `marketer_commissions`
--
ALTER TABLE `marketer_commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `marketer_id` (`marketer_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- Indexes for table `marketer_point_redemptions`
--
ALTER TABLE `marketer_point_redemptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `marketer_id` (`marketer_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `marketer_withdrawals`
--
ALTER TABLE `marketer_withdrawals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `marketer_id` (`marketer_id`);

--
-- Indexes for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `packages`
--
ALTER TABLE `packages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subscription_type_id` (`subscription_type_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`permission_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `package_id` (`package_id`),
  ADD KEY `idx_purchases_phone_lesson` (`phone_number`,`lesson_id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`question_id`);

--
-- Indexes for table `referral_logs`
--
ALTER TABLE `referral_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `marketer_id` (`marketer_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_role_page` (`role_id`,`page`);

--
-- Indexes for table `scheduler`
--
ALTER TABLE `scheduler`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services_settings`
--
ALTER TABLE `services_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscriber_tracker`
--
ALTER TABLE `subscriber_tracker`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscription_types`
--
ALTER TABLE `subscription_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subtopics`
--
ALTER TABLE `subtopics`
  ADD PRIMARY KEY (`subtopic_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `topics`
--
ALTER TABLE `topics`
  ADD PRIMARY KEY (`topic_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_reference` (`transaction_reference`),
  ADD UNIQUE KEY `checkout_request_id` (`checkout_request_id`);

--
-- Indexes for table `tutorials_settings`
--
ALTER TABLE `tutorials_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tutorial_register`
--
ALTER TABLE `tutorial_register`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_role_id` (`user_role_id`);

--
-- Indexes for table `user_activity`
--
ALTER TABLE `user_activity`
  ADD PRIMARY KEY (`activity_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `user_guide`
--
ALTER TABLE `user_guide`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_privileges`
--
ALTER TABLE `user_privileges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_privilege` (`privilege`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_user_privilege` (`user_id`,`privilege`,`is_active`);

--
-- Indexes for table `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `about_us`
--
ALTER TABLE `about_us`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assign_rights`
--
ALTER TABLE `assign_rights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contact_us`
--
ALTER TABLE `contact_us`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `grades`
--
ALTER TABLE `grades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guest_lesson_payments`
--
ALTER TABLE `guest_lesson_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guest_tracker`
--
ALTER TABLE `guest_tracker`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guest_users`
--
ALTER TABLE `guest_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invites`
--
ALTER TABLE `invites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `learning_areas`
--
ALTER TABLE `learning_areas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `learning_levels`
--
ALTER TABLE `learning_levels`
  MODIFY `level_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lessons`
--
ALTER TABLE `lessons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_access_logs`
--
ALTER TABLE `lesson_access_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_setting`
--
ALTER TABLE `lesson_setting`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_track`
--
ALTER TABLE `lesson_track`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketers`
--
ALTER TABLE `marketers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketer_commissions`
--
ALTER TABLE `marketer_commissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketer_point_redemptions`
--
ALTER TABLE `marketer_point_redemptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketer_withdrawals`
--
ALTER TABLE `marketer_withdrawals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `packages`
--
ALTER TABLE `packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `permission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `question_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `referral_logs`
--
ALTER TABLE `referral_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `scheduler`
--
ALTER TABLE `scheduler`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `services_settings`
--
ALTER TABLE `services_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscriber_tracker`
--
ALTER TABLE `subscriber_tracker`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_types`
--
ALTER TABLE `subscription_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subtopics`
--
ALTER TABLE `subtopics`
  MODIFY `subtopic_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `topics`
--
ALTER TABLE `topics`
  MODIFY `topic_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tutorials_settings`
--
ALTER TABLE `tutorials_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tutorial_register`
--
ALTER TABLE `tutorial_register`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_activity`
--
ALTER TABLE `user_activity`
  MODIFY `activity_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_guide`
--
ALTER TABLE `user_guide`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_privileges`
--
ALTER TABLE `user_privileges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `videos`
--
ALTER TABLE `videos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `lessons`
--
ALTER TABLE `lessons`
  ADD CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `learning_areas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_access_logs`
--
ALTER TABLE `lesson_access_logs`
  ADD CONSTRAINT `fk_lesson_access_logs_guest_tracker_id` FOREIGN KEY (`guest_tracker_id`) REFERENCES `guest_tracker` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lesson_access_logs_lesson_track_id` FOREIGN KEY (`lesson_track_id`) REFERENCES `lesson_track` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lesson_access_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `marketer_commissions`
--
ALTER TABLE `marketer_commissions`
  ADD CONSTRAINT `marketer_commissions_ibfk_1` FOREIGN KEY (`marketer_id`) REFERENCES `marketers` (`id`),
  ADD CONSTRAINT `marketer_commissions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `marketer_commissions_ibfk_3` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`);

--
-- Constraints for table `marketer_point_redemptions`
--
ALTER TABLE `marketer_point_redemptions`
  ADD CONSTRAINT `marketer_point_redemptions_ibfk_1` FOREIGN KEY (`marketer_id`) REFERENCES `marketers` (`id`),
  ADD CONSTRAINT `marketer_point_redemptions_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `marketer_withdrawals`
--
ALTER TABLE `marketer_withdrawals`
  ADD CONSTRAINT `marketer_withdrawals_ibfk_1` FOREIGN KEY (`marketer_id`) REFERENCES `marketers` (`id`);

--
-- Constraints for table `packages`
--
ALTER TABLE `packages`
  ADD CONSTRAINT `packages_ibfk_1` FOREIGN KEY (`subscription_type_id`) REFERENCES `subscription_types` (`id`);

--
-- Constraints for table `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE;

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `referral_logs`
--
ALTER TABLE `referral_logs`
  ADD CONSTRAINT `referral_logs_ibfk_1` FOREIGN KEY (`marketer_id`) REFERENCES `marketers` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`user_role_id`) REFERENCES `roles` (`role_id`) ON DELETE SET NULL;

--
-- Constraints for table `user_activity`
--
ALTER TABLE `user_activity`
  ADD CONSTRAINT `user_activity_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
