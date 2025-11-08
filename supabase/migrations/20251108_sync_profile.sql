-- Ensure a last_synced_at column exists, then create a sync_profile RPC
BEGIN;

-- Add column if it doesn't exist (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN last_synced_at timestamptz;
  END IF;
END;
$$;

-- Create or replace the sync_profile function
CREATE OR REPLACE FUNCTION public.sync_profile(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Update a last_synced_at timestamp so other systems can detect the change
  UPDATE public.profiles
  SET last_synced_at = now()
  WHERE id = p_user_id;

  -- Emit a notification on channel 'profile_sync' (optional listeners can act)
  PERFORM pg_notify('profile_sync', p_user_id::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
