-- Add missing checkout_request_id column to marketer_withdrawals table
ALTER TABLE marketer_withdrawals ADD COLUMN checkout_request_id VARCHAR(100) NULL AFTER phone_number;