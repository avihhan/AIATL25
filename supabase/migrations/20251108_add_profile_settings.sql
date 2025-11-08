BEGIN;

-- Add theme column
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'system';

-- Add density column
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS density text DEFAULT 'comfortable';

-- Add language column
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS language text DEFAULT 'English (US)';

-- Add timezone column
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- Add notifications JSONB column
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"email": true, "marketing": false, "system": true}';

-- Add two_factor_enabled boolean column
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;

COMMIT;
