-- Create all tables from scratch
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    minecraft_username VARCHAR(16) UNIQUE NOT NULL,
    minecraft_uuid VARCHAR(36) DEFAULT NULL,
    real_name VARCHAR(100) DEFAULT NULL,
    year_group INT DEFAULT NULL,
    rank_color VARCHAR(20) DEFAULT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_minecraft_username (minecraft_username),
    INDEX idx_email (email),
    INDEX idx_verified (verified),
    INDEX idx_is_admin (is_admin),
    INDEX idx_minecraft_uuid (minecraft_uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS registration_tokens (
    token VARCHAR(64) PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expires_at (expires_at),
    INDEX idx_minecraft_username (minecraft_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Set admin user
UPDATE users SET is_admin = TRUE WHERE email = '20-tsvetanov-k@thestreetlyacademy.co.uk';
