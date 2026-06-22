ALTER TABLE trips ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS image_credit jsonb;
