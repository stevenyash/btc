-- Permissions and Role Permissions SQL Insert Statements
-- Generated for BTC Project
-- Date: 2024-02-02

-- ============================================
-- CREATE TABLE role_permissions (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `list` INT(11) NOT NULL DEFAULT 1,
    `edit` INT(11) NOT NULL DEFAULT 1,
    `remove` INT(11) NOT NULL DEFAULT 1,
    `view` INT(11) NOT NULL DEFAULT 1,
    `role_id` INT(11) NOT NULL DEFAULT 1,
    `page` VARCHAR(255) NOT NULL DEFAULT '',
    `store` INT(11) NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `unique_role_page` (`role_id`, `page`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREATE TABLE assign_rights (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS `assign_rights` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `description` VARCHAR(255) NULL,
    `permission` VARCHAR(255) NOT NULL DEFAULT '',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `unique_assign_rights_permission` (`permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT ROLES (if not exists)
-- ============================================
INSERT INTO `roles` (`role_name`) VALUES 
    ('client'),
    ('admin'),
    ('superadmin'),
    ('marketer'),
    ('teacher')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Get role IDs for reference
-- Assuming: client=1, admin=2, superadmin=3, marketer=4, teacher=5

-- ============================================
-- INSERT INTO assign_rights (Permission Descriptions)
-- ============================================
INSERT INTO `assign_rights` (`description`, `permission`) VALUES 
    ('Access to Home Dashboard', 'home'),
    ('Manage Users', 'users'),
    ('View User List', 'users.list'),
    ('Add New User', 'users.add'),
    ('Edit User', 'users.edit'),
    ('Delete User', 'users.delete'),
    ('View User Details', 'users.view'),
    ('Manage Roles', 'roles'),
    ('View Role List', 'roles.list'),
    ('Add New Role', 'roles.add'),
    ('Edit Role', 'roles.edit'),
    ('Delete Role', 'roles.delete'),
    ('View Role Details', 'roles.view'),
    ('Manage Permissions', 'permissions'),
    ('View Permission List', 'permissions.list'),
    ('Add Permission', 'permissions.add'),
    ('Edit Permission', 'permissions.edit'),
    ('Delete Permission', 'permissions.delete'),
    ('View Permission Details', 'permissions.view'),
    ('Manage Role Permissions', 'rolepermissions'),
    ('Manage User Privileges', 'userprivileges'),
    ('Manage Assign Rights', 'assignrights'),
    ('Manage About Us', 'aboutus'),
    ('View About Us List', 'aboutus.list'),
    ('Add About Us Entry', 'aboutus.add'),
    ('Edit About Us Entry', 'aboutus.edit'),
    ('Delete About Us Entry', 'aboutus.delete'),
    ('View About Us Details', 'aboutus.view'),
    ('Manage Services', 'services'),
    ('View Services List', 'services.list'),
    ('Add Service', 'services.add'),
    ('Edit Service', 'services.edit'),
    ('Delete Service', 'services.delete'),
    ('View Service Details', 'services.view'),
    ('Manage Subscriptions', 'subscriptions'),
    ('View Subscription List', 'subscriptions.list'),
    ('Add Subscription', 'subscriptions.add'),
    ('Edit Subscription', 'subscriptions.edit'),
    ('Delete Subscription', 'subscriptions.delete'),
    ('View Subscription Details', 'subscriptions.view'),
    ('Manage Active Subscriptions', 'activesubscriptions'),
    ('Manage Expired Subscriptions', 'expiredsubscriptions'),
    ('Manage Monthly Subscription Summary', 'monthlysubscriptionsummary'),
    ('Manage Subscription Renewal', 'subscriptionsrenewal'),
    ('Manage Subscription Status', 'subscriptionstatusdistribution'),
    ('Manage Subscriptions By Type', 'subscriptionsbytype'),
    ('Manage Transactions', 'transactions'),
    ('View Transaction List', 'transactions.list'),
    ('Add Transaction', 'transactions.add'),
    ('Edit Transaction', 'transactions.edit'),
    ('Delete Transaction', 'transactions.delete'),
    ('View Transaction Details', 'transactions.view'),
    ('Manage Contact Us', 'contactus'),
    ('View Contact List', 'contactus.list'),
    ('Add Contact Entry', 'contactus.add'),
    ('Edit Contact Entry', 'contactus.edit'),
    ('Delete Contact Entry', 'contactus.delete'),
    ('View Contact Details', 'contactus.view'),
    ('Manage Grades', 'grades'),
    ('View Grades List', 'grades.list'),
    ('Add Grade', 'grades.add'),
    ('Edit Grade', 'grades.edit'),
    ('Delete Grade', 'grades.delete'),
    ('View Grade Details', 'grades.view'),
    ('Manage Learning Levels', 'learninglevels'),
    ('Manage Learning Areas', 'learningareas'),
    ('Manage Lessons', 'lessons'),
    ('View Lesson List', 'lessons.list'),
    ('Add Lesson', 'lessons.add'),
    ('Edit Lesson', 'lessons.edit'),
    ('Delete Lesson', 'lessons.delete'),
    ('View Lesson Details', 'lessons.view'),
    ('Manage Lesson Settings', 'lessonsetting'),
    ('Manage Tutorials Settings', 'tutorialssettings'),
    ('Manage Questions', 'questions'),
    ('Manage Scheduler', 'scheduler'),
    ('Manage Tutorial Register', 'tutorialregister'),
    ('Manage Packages', 'packages'),
    ('View Packages List', 'packages.list'),
    ('Add Package', 'packages.add'),
    ('Edit Package', 'packages.edit'),
    ('Delete Package', 'packages.delete'),
    ('View Package Details', 'packages.view'),
    ('Manage Subscription Types', 'subscriptiontypes'),
    ('Manage Guest Users', 'guestusers'),
    ('View Guest Users List', 'guestusers.list'),
    ('Add Guest User', 'guestusers.add'),
    ('Edit Guest User', 'guestusers.edit'),
    ('Delete Guest User', 'guestusers.delete'),
    ('View Guest User Details', 'guestusers.view'),
    ('Manage Guest Tracker', 'guesttracker'),
    ('Manage Marketers', 'marketers'),
    ('Manage Invites', 'invites'),
    ('Manage Newsletter Subscribers', 'newslettersubscribers'),
    ('Manage Videos', 'videos'),
    ('Manage Callbacks', 'callbacks'),
    ('Manage User Guide', 'userguide'),
    ('Manage User Guide Settings', 'userguidesetting'),
    ('Manage Lesson Fee', 'lessonfee'),
    ('Manage Lesson Access Logs', 'lessonaccesslogs'),
    ('Manage Lesson Track', 'lessontrack'),
    ('Manage Purchases', 'purchases'),
    ('Manage Subscriber Tracker', 'subscribertracker'),
    ('Manage User Activity', 'useractivity'),
    ('Manage Referrallogs', 'referrallogs')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ============================================
-- INSERT INTO role_permissions (Page-based CRUD Permissions)
-- ============================================
-- For superadmin (role_id = 3) - Full access to all pages
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES 
    (3, 'home', 1, 1, 1, 1, 1),
    (3, 'users', 1, 1, 1, 1, 1),
    (3, 'roles', 1, 1, 1, 1, 1),
    (3, 'permissions', 1, 1, 1, 1, 1),
    (3, 'userprivileges', 1, 1, 1, 1, 1),
    (3, 'assignrights', 1, 1, 1, 1, 1),
    (3, 'rolepermissions', 1, 1, 1, 1, 1),
    (3, 'aboutus', 1, 1, 1, 1, 1),
    (3, 'services', 1, 1, 1, 1, 1),
    (3, 'subscriptions', 1, 1, 1, 1, 1),
    (3, 'activesubscriptions', 1, 1, 1, 1, 1),
    (3, 'expiredsubscriptions', 1, 1, 1, 1, 1),
    (3, 'monthlysubscriptionsummary', 1, 1, 1, 1, 1),
    (3, 'subscriptionsrenewal', 1, 1, 1, 1, 1),
    (3, 'subscriptionstatusdistribution', 1, 1, 1, 1, 1),
    (3, 'subscriptionsbytype', 1, 1, 1, 1, 1),
    (3, 'transactions', 1, 1, 1, 1, 1),
    (3, 'contactus', 1, 1, 1, 1, 1),
    (3, 'grades', 1, 1, 1, 1, 1),
    (3, 'learninglevels', 1, 1, 1, 1, 1),
    (3, 'learningareas', 1, 1, 1, 1, 1),
    (3, 'lessons', 1, 1, 1, 1, 1),
    (3, 'lessonsetting', 1, 1, 1, 1, 1),
    (3, 'tutorialssettings', 1, 1, 1, 1, 1),
    (3, 'questions', 1, 1, 1, 1, 1),
    (3, 'scheduler', 1, 1, 1, 1, 1),
    (3, 'tutorialregister', 1, 1, 1, 1, 1),
    (3, 'packages', 1, 1, 1, 1, 1),
    (3, 'subscriptiontypes', 1, 1, 1, 1, 1),
    (3, 'guestusers', 1, 1, 1, 1, 1),
    (3, 'guesttracker', 1, 1, 1, 1, 1),
    (3, 'marketers', 1, 1, 1, 1, 1),
    (3, 'invites', 1, 1, 1, 1, 1),
    (3, 'newslettersubscribers', 1, 1, 1, 1, 1),
    (3, 'videos', 1, 1, 1, 1, 1),
    (3, 'callbacks', 1, 1, 1, 1, 1),
    (3, 'userguide', 1, 1, 1, 1, 1),
    (3, 'userguidesetting', 1, 1, 1, 1, 1),
    (3, 'lessonfee', 1, 1, 1, 1, 1),
    (3, 'lessonaccesslogs', 1, 1, 1, 1, 1),
    (3, 'lessontrack', 1, 1, 1, 1, 1),
    (3, 'purchases', 1, 1, 1, 1, 1),
    (3, 'subscribertracker', 1, 1, 1, 1, 1),
    (3, 'useractivity', 1, 1, 1, 1, 1),
    (3, 'referrallogs', 1, 1, 1, 1, 1),
    (3, 'marketers/dashboard', 1, 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- For admin (role_id = 2) - Limited access (no delete, limited edit)
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES 
    (2, 'home', 1, 1, 0, 1, 1),
    (2, 'users', 1, 1, 0, 1, 1),
    (2, 'roles', 1, 0, 0, 1, 0),
    (2, 'permissions', 1, 0, 0, 1, 0),
    (2, 'userprivileges', 1, 1, 0, 1, 1),
    (2, 'assignrights', 1, 1, 0, 1, 1),
    (2, 'rolepermissions', 1, 1, 0, 1, 1),
    (2, 'aboutus', 1, 1, 0, 1, 1),
    (2, 'services', 1, 1, 0, 1, 1),
    (2, 'subscriptions', 1, 1, 0, 1, 1),
    (2, 'activesubscriptions', 1, 1, 0, 1, 1),
    (2, 'expiredsubscriptions', 1, 0, 0, 1, 0),
    (2, 'monthlysubscriptionsummary', 1, 0, 0, 1, 0),
    (2, 'subscriptionsrenewal', 1, 1, 0, 1, 1),
    (2, 'subscriptionstatusdistribution', 1, 0, 0, 1, 0),
    (2, 'subscriptionsbytype', 1, 0, 0, 1, 0),
    (2, 'transactions', 1, 0, 0, 1, 0),
    (2, 'contactus', 1, 1, 0, 1, 1),
    (2, 'grades', 1, 1, 0, 1, 1),
    (2, 'learninglevels', 1, 1, 0, 1, 1),
    (2, 'learningareas', 1, 1, 0, 1, 1),
    (2, 'lessons', 1, 1, 0, 1, 1),
    (2, 'lessonsetting', 1, 0, 0, 1, 0),
    (2, 'tutorialssettings', 1, 1, 0, 1, 1),
    (2, 'questions', 1, 1, 0, 1, 1),
    (2, 'scheduler', 1, 1, 0, 1, 1),
    (2, 'tutorialregister', 1, 1, 0, 1, 1),
    (2, 'packages', 1, 1, 0, 1, 1),
    (2, 'subscriptiontypes', 1, 0, 0, 1, 0),
    (2, 'guestusers', 1, 1, 0, 1, 1),
    (2, 'guesttracker', 1, 1, 0, 1, 1),
    (2, 'marketers', 1, 1, 0, 1, 1),
    (2, 'invites', 1, 1, 0, 1, 1),
    (2, 'newslettersubscribers', 1, 1, 0, 1, 1),
    (2, 'videos', 1, 1, 0, 1, 1),
    (2, 'callbacks', 1, 0, 0, 1, 0),
    (2, 'userguide', 1, 0, 0, 1, 0),
    (2, 'userguidesetting', 1, 0, 0, 1, 0),
    (2, 'lessonfee', 1, 1, 0, 1, 1),
    (2, 'lessonaccesslogs', 1, 0, 0, 1, 0),
    (2, 'lessontrack', 1, 0, 0, 1, 0),
    (2, 'purchases', 1, 0, 0, 1, 0),
    (2, 'subscribertracker', 1, 0, 0, 1, 0),
    (2, 'useractivity', 1, 0, 0, 1, 0),
    (2, 'referrallogs', 1, 0, 0, 1, 0),
    (2, 'marketers/dashboard', 1, 0, 0, 1, 0)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- For client (role_id = 1) - Read-only access
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES 
    (1, 'home', 1, 0, 0, 1, 0),
    (1, 'users', 0, 0, 0, 0, 0),
    (1, 'roles', 0, 0, 0, 0, 0),
    (1, 'permissions', 0, 0, 0, 0, 0),
    (1, 'userprivileges', 0, 0, 0, 0, 0),
    (1, 'assignrights', 0, 0, 0, 0, 0),
    (1, 'rolepermissions', 0, 0, 0, 0, 0),
    (1, 'aboutus', 1, 0, 0, 1, 0),
    (1, 'services', 1, 0, 0, 1, 0),
    (1, 'subscriptions', 0, 0, 0, 0, 0),
    (1, 'activesubscriptions', 0, 0, 0, 0, 0),
    (1, 'expiredsubscriptions', 0, 0, 0, 0, 0),
    (1, 'monthlysubscriptionsummary', 0, 0, 0, 0, 0),
    (1, 'subscriptionsrenewal', 0, 0, 0, 0, 0),
    (1, 'subscriptionstatusdistribution', 0, 0, 0, 0, 0),
    (1, 'subscriptionsbytype', 0, 0, 0, 0, 0),
    (1, 'transactions', 0, 0, 0, 0, 0),
    (1, 'contactus', 1, 0, 0, 1, 0),
    (1, 'grades', 1, 0, 0, 1, 0),
    (1, 'learninglevels', 1, 0, 0, 1, 0),
    (1, 'learningareas', 1, 0, 0, 1, 0),
    (1, 'lessons', 1, 0, 0, 1, 0),
    (1, 'lessonsetting', 0, 0, 0, 0, 0),
    (1, 'tutorialssettings', 0, 0, 0, 0, 0),
    (1, 'questions', 1, 0, 0, 1, 0),
    (1, 'scheduler', 0, 0, 0, 0, 0),
    (1, 'tutorialregister', 0, 0, 0, 0, 0),
    (1, 'packages', 1, 0, 0, 1, 0),
    (1, 'subscriptiontypes', 1, 0, 0, 1, 0),
    (1, 'guestusers', 0, 0, 0, 0, 0),
    (1, 'guesttracker', 0, 0, 0, 0, 0),
    (1, 'marketers', 0, 0, 0, 0, 0),
    (1, 'invites', 0, 0, 0, 0, 0),
    (1, 'newslettersubscribers', 0, 0, 0, 0, 0),
    (1, 'videos', 1, 0, 0, 1, 0),
    (1, 'callbacks', 0, 0, 0, 0, 0),
    (1, 'userguide', 1, 0, 0, 1, 0),
    (1, 'userguidesetting', 0, 0, 0, 0, 0),
    (1, 'lessonfee', 0, 0, 0, 0, 0),
    (1, 'lessonaccesslogs', 0, 0, 0, 0, 0),
    (1, 'lessontrack', 1, 0, 0, 1, 0),
    (1, 'purchases', 0, 0, 0, 0, 0),
    (1, 'subscribertracker', 0, 0, 0, 0, 0),
    (1, 'useractivity', 0, 0, 0, 0, 0),
    (1, 'referrallogs', 0, 0, 0, 0, 0)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- For marketer (role_id = 4) - Marketing and reporting access
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES 
    (4, 'home', 1, 0, 0, 1, 0),
    (4, 'users', 1, 0, 0, 1, 0),
    (4, 'roles', 0, 0, 0, 0, 0),
    (4, 'permissions', 0, 0, 0, 0, 0),
    (4, 'userprivileges', 0, 0, 0, 0, 0),
    (4, 'assignrights', 0, 0, 0, 0, 0),
    (4, 'rolepermissions', 0, 0, 0, 0, 0),
    (4, 'aboutus', 1, 1, 0, 1, 1),
    (4, 'services', 1, 1, 0, 1, 1),
    (4, 'subscriptions', 1, 0, 0, 1, 0),
    (4, 'activesubscriptions', 1, 0, 0, 1, 0),
    (4, 'expiredsubscriptions', 1, 0, 0, 1, 0),
    (4, 'monthlysubscriptionsummary', 1, 0, 0, 1, 0),
    (4, 'subscriptionsrenewal', 1, 0, 0, 1, 0),
    (4, 'subscriptionstatusdistribution', 1, 0, 0, 1, 0),
    (4, 'subscriptionsbytype', 1, 0, 0, 1, 0),
    (4, 'transactions', 1, 0, 0, 1, 0),
    (4, 'contactus', 1, 1, 0, 1, 1),
    (4, 'grades', 1, 0, 0, 1, 0),
    (4, 'learninglevels', 1, 0, 0, 1, 0),
    (4, 'learningareas', 1, 0, 0, 1, 0),
    (4, 'lessons', 1, 0, 0, 1, 0),
    (4, 'lessonsetting', 0, 0, 0, 0, 0),
    (4, 'tutorialssettings', 0, 0, 0, 0, 0),
    (4, 'questions', 1, 0, 0, 1, 0),
    (4, 'scheduler', 0, 0, 0, 0, 0),
    (4, 'tutorialregister', 0, 0, 0, 0, 0),
    (4, 'packages', 1, 0, 0, 1, 0),
    (4, 'subscriptiontypes', 1, 0, 0, 1, 0),
    (4, 'guestusers', 1, 0, 0, 1, 0),
    (4, 'guesttracker', 1, 1, 0, 1, 1),
    (4, 'marketers', 1, 1, 1, 1, 1),
    (4, 'invites', 1, 1, 1, 1, 1),
    (4, 'newslettersubscribers', 1, 1, 1, 1, 1),
    (4, 'videos', 1, 0, 0, 1, 0),
    (4, 'callbacks', 1, 0, 0, 1, 0),
    (4, 'userguide', 1, 0, 0, 1, 0),
    (4, 'userguidesetting', 0, 0, 0, 0, 0),
    (4, 'lessonfee', 0, 0, 0, 0, 0),
    (4, 'lessonaccesslogs', 0, 0, 0, 0, 0),
    (4, 'lessontrack', 1, 0, 0, 1, 0),
    (4, 'purchases', 1, 0, 0, 1, 0),
    (4, 'subscribertracker', 1, 0, 0, 1, 0),
    (4, 'useractivity', 1, 0, 0, 1, 0),
    (4, 'referrallogs', 1, 1, 0, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- Add marketers/dashboard permission for marketer role
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES 
    (4, 'marketers/dashboard', 1, 0, 0, 1, 0)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- For teacher (role_id = 5) - Teaching and content management access
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES 
    (5, 'home', 1, 0, 0, 1, 0),
    (5, 'users', 0, 0, 0, 0, 0),
    (5, 'roles', 0, 0, 0, 0, 0),
    (5, 'permissions', 0, 0, 0, 0, 0),
    (5, 'userprivileges', 0, 0, 0, 0, 0),
    (5, 'assignrights', 0, 0, 0, 0, 0),
    (5, 'rolepermissions', 0, 0, 0, 0, 0),
    (5, 'aboutus', 1, 0, 0, 1, 0),
    (5, 'services', 1, 0, 0, 1, 0),
    (5, 'subscriptions', 0, 0, 0, 0, 0),
    (5, 'activesubscriptions', 0, 0, 0, 0, 0),
    (5, 'expiredsubscriptions', 0, 0, 0, 0, 0),
    (5, 'monthlysubscriptionsummary', 0, 0, 0, 0, 0),
    (5, 'subscriptionsrenewal', 0, 0, 0, 0, 0),
    (5, 'subscriptionstatusdistribution', 0, 0, 0, 0, 0),
    (5, 'subscriptionsbytype', 0, 0, 0, 0, 0),
    (5, 'transactions', 0, 0, 0, 0, 0),
    (5, 'contactus', 1, 0, 0, 1, 0),
    (5, 'grades', 1, 1, 0, 1, 1),
    (5, 'learninglevels', 1, 1, 0, 1, 1),
    (5, 'learningareas', 1, 1, 0, 1, 1),
    (5, 'lessons', 1, 1, 1, 1, 1),
    (5, 'lessonsetting', 1, 1, 0, 1, 1),
    (5, 'tutorialssettings', 1, 1, 0, 1, 1),
    (5, 'questions', 1, 1, 1, 1, 1),
    (5, 'scheduler', 1, 1, 0, 1, 1),
    (5, 'tutorialregister', 1, 1, 0, 1, 1),
    (5, 'packages', 0, 0, 0, 0, 0),
    (5, 'subscriptiontypes', 0, 0, 0, 0, 0),
    (5, 'guestusers', 0, 0, 0, 0, 0),
    (5, 'guesttracker', 0, 0, 0, 0, 0),
    (5, 'marketers', 0, 0, 0, 0, 0),
    (5, 'invites', 0, 0, 0, 0, 0),
    (5, 'newslettersubscribers', 0, 0, 0, 0, 0),
    (5, 'videos', 1, 1, 0, 1, 1),
    (5, 'callbacks', 0, 0, 0, 0, 0),
    (5, 'userguide', 0, 0, 0, 0, 0),
    (5, 'userguidesetting', 0, 0, 0, 0, 0),
    (5, 'lessonfee', 1, 1, 0, 1, 1),
    (5, 'lessonaccesslogs', 1, 0, 0, 1, 0),
    (5, 'lessontrack', 1, 1, 0, 1, 1),
    (5, 'purchases', 0, 0, 0, 0, 0),
    (5, 'subscribertracker', 0, 0, 0, 0, 0),
    (5, 'useractivity', 0, 0, 0, 0, 0),
    (5, 'referrallogs', 0, 0, 0, 0, 0)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- ============================================
-- INSERT INTO permissions (Direct Permission Assignments)
-- ============================================
-- For superadmin (role_id = 3) - All permissions
INSERT INTO `permissions` (`permission`, `role_id`, `user_id`) VALUES 
    ('superadmin.access', 3, NULL),
    ('users.manage', 3, NULL),
    ('roles.manage', 3, NULL),
    ('permissions.manage', 3, NULL),
    ('system.settings', 3, NULL),
    ('reports.view', 3, NULL),
    ('reports.export', 3, NULL)
ON DUPLICATE KEY UPDATE permission = VALUES(permission);

-- For admin (role_id = 2)
INSERT INTO `permissions` (`permission`, `role_id`, `user_id`) VALUES 
    ('admin.access', 2, NULL),
    ('users.view', 2, NULL),
    ('users.edit', 2, NULL),
    ('reports.view', 2, NULL)
ON DUPLICATE KEY UPDATE permission = VALUES(permission);

-- For client (role_id = 1)
INSERT INTO `permissions` (`permission`, `role_id`, `user_id`) VALUES 
    ('client.access', 1, NULL),
    ('content.view', 1, NULL),
    ('profile.manage', 1, NULL)
ON DUPLICATE KEY UPDATE permission = VALUES(permission);

-- For marketer (role_id = 4)
INSERT INTO `permissions` (`permission`, `role_id`, `user_id`) VALUES 
    ('marketer.access', 4, NULL),
    ('marketing.manage', 4, NULL),
    ('invites.manage', 4, NULL),
    ('newsletter.manage', 4, NULL),
    ('reports.view', 4, NULL),
    ('guesttracker.manage', 4, NULL)
ON DUPLICATE KEY UPDATE permission = VALUES(permission);

-- For teacher (role_id = 5)
INSERT INTO `permissions` (`permission`, `role_id`, `user_id`) VALUES 
    ('teacher.access', 5, NULL),
    ('lessons.manage', 5, NULL),
    ('questions.manage', 5, NULL),
    ('grades.manage', 5, NULL),
    ('content.view', 5, NULL),
    ('scheduler.view', 5, NULL),
    ('scheduler.edit', 5, NULL)
ON DUPLICATE KEY UPDATE permission = VALUES(permission);
