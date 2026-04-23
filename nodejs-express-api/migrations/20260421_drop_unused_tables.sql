-- Migration: Drop unused tables
-- Date: 2026-04-21
-- Tables removed: expired_subscriptions, monthly_subscription_summary, rightslist, subscriptions_by_type,
--              subscriptions_per_user, subscriptions_renewal, subscription_status_distribution,
--              active_individual_package, user_permission_overrides

DROP TABLE IF EXISTS `expired_subscriptions`;
DROP TABLE IF EXISTS `monthly_subscription_summary`;
DROP TABLE IF EXISTS `rightslist`;
DROP TABLE IF EXISTS `subscriptions_by_type`;
DROP TABLE IF EXISTS `subscriptions_per_user`;
DROP TABLE IF EXISTS `subscriptions_renewal`;
DROP TABLE IF EXISTS `subscription_status_distribution`;
DROP TABLE IF EXISTS `active_individual_package`;
DROP TABLE IF EXISTS `user_permission_overrides`;