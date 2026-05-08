-- Add gmail_connected_at timestamp column to profiles table
-- google_refresh_token already exists in the schema
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gmail_connected_at TIMESTAMPTZ;
