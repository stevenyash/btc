-- Migration: Create user_privileges table
-- This table stores user-specific privileges that extend beyond role permissions
-- Date: 2024-02-02

-- Create user_privileges table
CREATE TABLE IF NOT EXISTS `user_privileges` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL COMMENT 'User ID who receives the privilege',
    `privilege` VARCHAR(255) NOT NULL COMMENT 'The privilege/permission granted',
    `granted_by` INT(11) NOT NULL COMMENT 'User ID of the Super Admin who granted this privilege',
    `granted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Whether this privilege is currently active',
    `expires_at` DATETIME NULL COMMENT 'Optional expiration date for temporary privileges',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_privilege` (`privilege`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_user_privilege` (`user_id`, `privilege`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User-specific privileges granted by Super Admin';

-- Insert default roles (if not already present)
INSERT INTO `roles` (`role_name`) VALUES 
    ('client'),
    ('admin'),
    ('superadmin')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Example: Grant additional privilege to a user (execute as needed)
-- INSERT INTO `user_privileges` (`user_id`, `privilege`, `granted_by`) 
-- VALUES (1, 'users/edit', 1);

-- View existing user privileges
-- SELECT up.*, u.username, g.username as granted_by_username 
-- FROM `user_privileges` up
-- JOIN `users` u ON up.user_id = u.id
-- JOIN `users` g ON up.granted_by = g.id
-- WHERE up.is_active = 1;
