-- Add missing columns for admin queries

-- Add user_id to marketers table
ALTER TABLE marketers ADD COLUMN user_id INT NULL AFTER id;

-- Add created_at to users table  
ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER subscription_date;