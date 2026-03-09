-- Add description and created_at columns to placement_drives table
ALTER TABLE placement_drives ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE placement_drives ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records with a default timestamp
UPDATE placement_drives SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
