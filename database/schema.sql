-- Minecraft Authentication System Database Schema
-- MySQL 8.0+

-- Drop tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS registration_tokens;
DROP TABLE IF EXISTS users;

-- Users table: stores all registered accounts
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    minecraft_username VARCHAR(16) UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_minecraft_username (minecraft_username),
    INDEX idx_email (email),
    INDEX idx_verified (verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registration tokens table: temporary tokens for registration links
CREATE TABLE registration_tokens (
    token VARCHAR(64) PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expires_at (expires_at),
    INDEX idx_minecraft_username (minecraft_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Add a cleanup event for expired tokens (runs every hour)
SET GLOBAL event_scheduler = ON;

DELIMITER //
CREATE EVENT IF NOT EXISTS cleanup_expired_tokens
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM registration_tokens WHERE expires_at < NOW();
END//
DELIMITER ;
