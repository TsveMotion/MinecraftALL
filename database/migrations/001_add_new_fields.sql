-- Migration: Add new fields for Streetly SMP features
-- Run this SQL script to update your existing database

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN real_name VARCHAR(100) DEFAULT NULL AFTER full_name,
ADD COLUMN year_group INT DEFAULT NULL AFTER real_name,
ADD COLUMN rank_color VARCHAR(20) DEFAULT NULL AFTER year_group,
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE AFTER rank_color,
ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL AFTER is_admin;

-- Add indexes for new fields
CREATE INDEX idx_is_admin ON users(is_admin);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    reported_id INT NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reporter_id (reporter_id),
    INDEX idx_reported_id (reported_id),
    INDEX idx_status (status),
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create bans table
CREATE TABLE IF NOT EXISTS bans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    banned_by VARCHAR(16) NOT NULL,
    reason TEXT,
    is_permanent BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_minecraft_username (minecraft_username),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Set admin user (update email as needed)
UPDATE users 
SET is_admin = TRUE 
WHERE email = '20-tsvetanov-k@thestreetlyacademy.co.uk';

-- Optional: Update existing users with parsed data
-- This will populate real_name, year_group, and rank_color for existing users
-- You may need to run this after registration or manually

-- Example: Update a specific user's data
-- UPDATE users 
-- SET 
--     real_name = 'K. Tsvetanov',
--     year_group = 12,
--     rank_color = '#FF9D3D'
-- WHERE email = '20-tsvetanov-k@thestreetlyacademy.co.uk';
