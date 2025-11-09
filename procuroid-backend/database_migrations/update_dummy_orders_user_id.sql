-- Update dummy orders to use your current user_id
-- This script reassigns all dummy orders to the most recently created user
-- 
-- INSTRUCTIONS:
-- 1. First, find your user_id by logging into the app and checking the browser console
--    or by checking Supabase Dashboard > Authentication > Users
-- 2. Replace 'YOUR_USER_ID_HERE' below with your actual user_id UUID
-- 3. Run this script in Supabase SQL Editor

-- Option 1: Update to a specific user_id (RECOMMENDED)
-- Replace 'YOUR_USER_ID_HERE' with your actual user_id UUID
UPDATE public.orders
SET user_id = 'YOUR_USER_ID_HERE'::uuid  -- Replace with your user_id
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
  AND created_at >= NOW() - INTERVAL '1 hour';  -- Only update recently created orders

-- Option 2: Update to the most recently created user (if you're the newest user)
-- Uncomment the lines below if you want to use this approach instead:
/*
UPDATE public.orders
SET user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
  AND created_at >= NOW() - INTERVAL '1 hour';
*/

-- Verify the update
SELECT 
    id,
    product_name,
    status,
    user_id,
    created_at
FROM public.orders
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid  -- Replace with your user_id
ORDER BY created_at DESC;

