-- Add isAdmin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Add application status columns to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending' NOT NULL;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS application_notes TEXT;