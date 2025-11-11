-- Migration: Ensure minecraft_uuid column exists on users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS minecraft_uuid VARCHAR(36) DEFAULT NULL AFTER minecraft_username;

CREATE INDEX IF NOT EXISTS idx_minecraft_uuid ON users(minecraft_uuid);
