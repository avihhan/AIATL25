# Running Database Migration for Profile Settings

The profile settings feature requires additional columns in the `profiles` table. You need to run the migration to add these columns.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/20251108_add_profile_settings.sql`
6. Click **Run** (or press Ctrl+Enter)

The migration will add these columns:
- `theme` (text, default: 'system')
- `density` (text, default: 'comfortable')
- `language` (text, default: 'English (US)')
- `timezone` (text, default: 'UTC')
- `notifications` (jsonb, default: '{"email": true, "marketing": false, "system": true}')
- `two_factor_enabled` (boolean, default: false)

## Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

Or manually:

```bash
supabase migration up
```

## Verification

After running the migration, you can verify the columns exist by running this query in the SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('theme', 'density', 'language', 'timezone', 'notifications', 'two_factor_enabled');
```

You should see all 6 columns listed.

## Note

The migration uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times. If the columns already exist, nothing will happen.

