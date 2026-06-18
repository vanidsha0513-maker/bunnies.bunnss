-- Run once: add member_id column and token to OTPs
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS member_id INT DEFAULT NULL AFTER note;

ALTER TABLE member_otps
  ADD COLUMN IF NOT EXISTS token VARCHAR(64) DEFAULT NULL;
