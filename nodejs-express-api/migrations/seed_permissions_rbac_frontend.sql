-- Seed SQL: RBAC Role Permissions for Marketer Withdrawals
-- Date: 2026-04-22
-- Role IDs: 1=client, 2=admin, 3=superadmin, 4=marketer, 5=teacher, 7=subscriber

-- ============================================
-- WITHDRAWAL ROLE PERMISSIONS
-- ============================================

-- Admin (role_id = 2) - can view, edit, process withdrawals
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES
    (2, 'withdrawals', 1, 1, 0, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- Superadmin (role_id = 3) - full access to withdrawals
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES
    (3, 'withdrawals', 1, 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- Marketer (role_id = 4) - can view own withdrawals and create new ones
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES
    (4, 'withdrawals', 1, 0, 0, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- ============================================
-- SUBSCRIBER ROLE PERMISSIONS (role_id = 7)
-- ============================================
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES
    (7, 'home', 1, 0, 0, 1, 0),
    (7, 'dashboard', 1, 0, 0, 1, 0),
    (7, 'lessons', 1, 0, 0, 1, 0),
    (7, 'mytutorials', 1, 0, 0, 1, 0),
    (7, 'subscriptions', 1, 0, 0, 1, 0),
    (7, 'packages', 1, 0, 0, 1, 0),
    (7, 'account', 1, 1, 0, 1, 1),
    (7, 'profile', 1, 1, 0, 1, 1),
    (7, 'transactions', 1, 0, 0, 1, 0),
    (7, 'weekendtutorials', 1, 0, 0, 1, 0),
    (7, 'gotoclass', 1, 0, 0, 1, 0),
    (7, 'marketer-dashboard', 1, 0, 0, 1, 0),
    (7, 'marketer-withdraw', 1, 0, 0, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- ============================================
-- ADMIN ROLE PERMISSIONS (role_id = 2)
-- ============================================
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES
    (2, 'home', 1, 0, 0, 1, 0),
    (2, 'admin', 1, 0, 0, 1, 0),
    (2, 'admin-users', 1, 1, 1, 1, 1),
    (2, 'admin-transactions', 1, 0, 0, 1, 0),
    (2, 'admin-packages', 1, 1, 1, 1, 1),
    (2, 'admin-marketers', 1, 1, 1, 1, 1),
    (2, 'admin-lessons', 1, 1, 1, 1, 1),
    (2, 'withdrawals', 1, 1, 0, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- ============================================
-- SUPERADMIN ROLE PERMISSIONS (role_id = 3)
-- ============================================
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES
    (3, 'home', 1, 0, 0, 1, 0),
    (3, 'admin', 1, 0, 0, 1, 0),
    (3, 'admin-users', 1, 1, 1, 1, 1),
    (3, 'admin-transactions', 1, 0, 0, 1, 0),
    (3, 'admin-packages', 1, 1, 1, 1, 1),
    (3, 'admin-marketers', 1, 1, 1, 1, 1),
    (3, 'admin-lessons', 1, 1, 1, 1, 1),
    (3, 'withdrawals', 1, 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);

-- ============================================
-- MARKETER ROLE PERMISSIONS (role_id = 4)
-- ============================================
INSERT INTO `role_permissions` (`role_id`, `page`, `list`, `edit`, `remove`, `view`, `store`) VALUES
    (4, 'home', 1, 0, 0, 1, 0),
    (4, 'marketer-dashboard', 1, 0, 0, 1, 0),
    (4, 'marketer-withdraw', 1, 0, 0, 1, 1),
    (4, 'marketer-earnings', 1, 0, 0, 1, 0),
    (4, 'marketer-redeem', 1, 0, 0, 1, 1),
    (4, 'invites', 1, 0, 0, 1, 0),
    (4, 'invites-add', 1, 0, 0, 1, 1)
ON DUPLICATE KEY UPDATE list = VALUES(list), edit = VALUES(edit), remove = VALUES(remove), view = VALUES(view), store = VALUES(store);