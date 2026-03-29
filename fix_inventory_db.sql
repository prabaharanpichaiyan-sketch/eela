-- Run this in your Supabase SQL Editor to add the missing column
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS costperunit DECIMAL(10, 3) DEFAULT 0;

-- Update existing records to have a default value if needed
UPDATE inventory SET costperunit = 0 WHERE costperunit IS NULL;
