-- Insert dummy quotations data using actual supplier IDs from supplier_database
-- This version links quotations to existing suppliers in the database

-- First, ensure you have suppliers in the supplier_database table
-- If not, run: procuroid-backend/database_migrations/seed_supplier_table.sql

INSERT INTO public.quotations (
    supplier_id,
    supplier_name,
    quotation_data,
    reason,
    status,
    user_id,
    created_at
) VALUES 
-- Quotation 1: Using TechNova Manufacturing (from seed data)
(
    (SELECT id FROM public.supplier_database WHERE company_name = 'TechNova Manufacturing' LIMIT 1),
    'TechNova Manufacturing',
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
    (SELECT id FROM auth.users LIMIT 1),
    NOW() - INTERVAL '2 days'
),

-- Quotation 2: Using BrightMetal Works (from seed data)
(
    (SELECT id FROM public.supplier_database WHERE company_name = 'BrightMetal Works' LIMIT 1),
    'BrightMetal Works',
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

-- Quotation 3: Using BrightMetal Works for aluminum sheets
(
    (SELECT id FROM public.supplier_database WHERE company_name = 'BrightMetal Works' LIMIT 1),
    'BrightMetal Works',
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

-- Quotation 4: Using NextGen Components (from seed data)
(
    (SELECT id FROM public.supplier_database WHERE company_name = 'NextGen Components' LIMIT 1),
    'NextGen Components',
    '{
        "price": 1250.50,
        "unit_price": 2.50,
        "total_price": 1250.50,
        "currency": "GBP",
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

-- Quotation 5: Using GreenLeaf Packaging (from seed data)
(
    (SELECT id FROM public.supplier_database WHERE company_name = 'GreenLeaf Packaging' LIMIT 1),
    'GreenLeaf Packaging',
    '{
        "price": 890.00,
        "unit_price": 8.90,
        "total_price": 890.00,
        "currency": "EUR",
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

-- Quotation 6: Using HyperTech Robotics (from seed data)
(
    (SELECT id FROM public.supplier_database WHERE company_name = 'HyperTech Robotics' LIMIT 1),
    'HyperTech Robotics',
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
    q.id,
    q.supplier_name,
    q.status,
    q.quotation_data->>'total_price' as total_price,
    q.quotation_data->>'currency' as currency,
    q.created_at,
    s.company_name as linked_supplier
FROM public.quotations q
LEFT JOIN public.supplier_database s ON q.supplier_id = s.id
WHERE q.status = 'pending_approval'
ORDER BY q.created_at DESC;

