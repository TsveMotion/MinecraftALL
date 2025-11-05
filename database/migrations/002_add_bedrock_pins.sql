-- Migration: Add bedrock_pins table for Bedrock player PIN authentication
-- This table stores temporary PINs for Bedrock players to authenticate

CREATE TABLE IF NOT EXISTS bedrock_pins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    pin VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pin (pin),
    INDEX idx_username (minecraft_username),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for efficient cleanup of expired PINs
CREATE INDEX idx_pin_expiry ON bedrock_pins(expires_at);
