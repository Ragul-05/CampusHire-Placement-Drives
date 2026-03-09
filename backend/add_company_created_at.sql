-- Add created_at column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records with a default timestamp
UPDATE companies SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
