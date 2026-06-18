-- Run once: add shipping + payment columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS items_total      DECIMAL(15,0) DEFAULT 0    AFTER total_amount,
  ADD COLUMN IF NOT EXISTS shipping_fee     DECIMAL(15,0) DEFAULT 0    AFTER items_total,
  ADD COLUMN IF NOT EXISTS shipping_company VARCHAR(50)   DEFAULT NULL AFTER shipping_fee,
  ADD COLUMN IF NOT EXISTS member_number    VARCHAR(100)  DEFAULT NULL AFTER shipping_company,
  ADD COLUMN IF NOT EXISTS payment_method   VARCHAR(20)   DEFAULT 'transfer' AFTER member_number;

-- OTP temp storage (cleared after verification)
CREATE TABLE IF NOT EXISTS member_otps (
  phone      VARCHAR(20) PRIMARY KEY,
  otp        VARCHAR(6)  NOT NULL,
  expires_at DATETIME    NOT NULL
);

-- Verified members
CREATE TABLE IF NOT EXISTS members (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  phone            VARCHAR(20) UNIQUE NOT NULL,
  shipping_company VARCHAR(50)  DEFAULT NULL,
  member_number    VARCHAR(100) DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
