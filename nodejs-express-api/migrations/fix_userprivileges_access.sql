-- Fix User Privileges Access
-- Run this SQL to ensure userprivileges is accessible to superadmin

-- 1. Create user_privileges table if it doesn't exist
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

-- 2. Ensure superadmin role exists (role_id = 3)
INSERT INTO `roles` (`id`, `role_name`) VALUES
    (1, 'client'),
    (2, 'admin'),
    (3, 'superadmin'),
    (4, 'marketer'),
    (5, 'teacher')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- 3. Add userprivileges permission for superadmin
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES
    (3, 'userprivileges', 1, 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- 4. Add userprivileges permission for admin
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES
    (2, 'userprivileges', 1, 1, 0, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- 5. Add assign_rights entry for userprivileges
INSERT INTO `assign_rights` (`description`, `permission`) VALUES
    ('Manage User Privileges', 'userprivileges')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 6. Verify your user has superadmin role (replace with your actual user ID)
-- SELECT id, username, role_id FROM users WHERE username = 'your_username';

-- 7. To set a user as superadmin (replace 1 with your user ID):
-- UPDATE users SET role_id = 3 WHERE id = 1;
