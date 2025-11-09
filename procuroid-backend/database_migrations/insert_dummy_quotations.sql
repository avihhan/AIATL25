-- Insert dummy quotations data for testing
-- Note: Replace the user_id UUIDs with actual user IDs from your auth.users table
-- You can get your user ID by running: SELECT id FROM auth.users LIMIT 1;

-- First, let's get a sample user_id (replace with your actual user ID)
-- For testing, we'll use a placeholder that you should replace

-- Example: Get the first user ID
-- DO $$
-- DECLARE
--     v_user_id UUID;
-- BEGIN
--     SELECT id INTO v_user_id FROM auth.users LIMIT 1;
--     
--     -- If no users exist, you'll need to create one first or use a specific UUID
--     IF v_user_id IS NULL THEN
--         RAISE EXCEPTION 'No users found. Please create a user first or specify a user_id.';
--     END IF;

-- Insert dummy quotations
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users

INSERT INTO public.quotations (
    supplier_id,
    supplier_name,
    quotation_data,
    reason,
    status,
    user_id,
    created_at
) VALUES 
-- Quotation 1: ABC Manufacturing - Welding Rods
-- Using NULL for supplier_id since supplier might not exist in database yet
(
    NULL, -- supplier_id (can be NULL if supplier not in database)
    'ABC Manufacturing',
    '{
        "price": 2450.00,
        "unit_price": 12.25,
        "total_price": 2450.00,
        "currency": "USD",
        "delivery_time": "2-3 weeks",
        "payment_terms": "Net 30",
        "quantity": 200,
        "unit_of_measurement": "pieces"
    }'::jsonb,
    'We can provide Grade 6061 welding rods with ISO certification. Bulk pricing available for orders over 500 pieces.',
    'pending_approval',
    (SELECT id FROM auth.users LIMIT 1), -- Use first user, or replace with specific UUID
    NOW() - INTERVAL '2 days'
),

-- Quotation 2: SteelCorp Industries - Steel Beams
(
    NULL, -- supplier_id
    'SteelCorp Industries',
    '{
        "price": 3200.00,
        "unit_price": 266.67,
        "total_price": 3200.00,
        "currency": "USD",
        "delivery_time": "3-4 weeks",
        "payment_terms": "Net 15",
        "quantity": 12,
        "unit_of_measurement": "beams"
    }'::jsonb,
    '12ft steel beams available from our warehouse. Can deliver to your location. Competitive pricing for bulk orders.',
    'pending_approval',
    (SELECT id FROM auth.users LIMIT 1),
    NOW() - INTERVAL '1 day'
),

-- Quotation 3: MetalWorks Ltd - Aluminum Sheets
(
    NULL, -- supplier_id
    'MetalWorks Ltd',
    '{
        "price": 1800.00,
        "unit_price": 18.00,
        "total_price": 1800.00,
        "currency": "USD",
        "delivery_time": "1-2 weeks",
        "payment_terms": "Net 30",
        "quantity": 100,
        "unit_of_measurement": "sheets"
    }'::jsonb,
    'Premium aluminum sheets, 4x8 size. In stock and ready to ship. We offer volume discounts for orders over 200 sheets.',
    'pending_approval',
    (SELECT id FROM auth.users LIMIT 1),
    NOW() - INTERVAL '5 hours'
),

-- Quotation 4: TechParts Inc - Electronic Components
(
    NULL, -- supplier_id
    'TechParts Inc',
    '{
        "price": 1250.50,
        "unit_price": 2.50,
        "total_price": 1250.50,
        "currency": "USD",
        "delivery_time": "1 week",
        "payment_terms": "Net 20",
        "quantity": 500,
        "unit_of_measurement": "units"
    }'::jsonb,
    'High-quality electronic components with CE and RoHS certification. Fast shipping available.',
    'pending_approval',
    (SELECT id FROM auth.users LIMIT 1),
    NOW() - INTERVAL '3 hours'
),

-- Quotation 5: Global Supplies Co - Packaging Materials
(
    NULL, -- supplier_id
    'Global Supplies Co',
    '{
        "price": 890.00,
        "unit_price": 8.90,
        "total_price": 890.00,
        "currency": "USD",
        "delivery_time": "5-7 business days",
        "payment_terms": "Net 30",
        "quantity": 100,
        "unit_of_measurement": "boxes"
    }'::jsonb,
    'Eco-friendly packaging materials. Custom printing available. Minimum order quantity applies.',
    'pending_approval',
    (SELECT id FROM auth.users LIMIT 1),
    NOW() - INTERVAL '1 hour'
),

-- Quotation 6: Industrial Tools Co - Power Tools
(
    NULL, -- supplier_id
    'Industrial Tools Co',
    '{
        "price": 4500.00,
        "unit_price": 450.00,
        "total_price": 4500.00,
        "currency": "USD",
        "delivery_time": "2-3 weeks",
        "payment_terms": "Net 30",
        "quantity": 10,
        "unit_of_measurement": "units"
    }'::jsonb,
    'Professional-grade power tools with 2-year warranty. Bulk pricing for orders of 20+ units.',
    'pending_approval',
    (SELECT id FROM auth.users LIMIT 1),
    NOW() - INTERVAL '30 minutes'
);

-- Verify the insertions
SELECT 
    id,
    supplier_name,
    status,
    quotation_data->>'total_price' as total_price,
    quotation_data->>'currency' as currency,
    created_at
FROM public.quotations
WHERE status = 'pending_approval'
ORDER BY created_at DESC;

