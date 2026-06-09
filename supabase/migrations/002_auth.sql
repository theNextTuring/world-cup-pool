-- Add password-based auth to users table

ALTER TABLE users ADD COLUMN password_hash TEXT;
