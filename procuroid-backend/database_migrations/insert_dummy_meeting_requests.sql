-- Insert dummy meeting_requests data for testing
-- This script creates meeting requests linked to suppliers and orders
-- 
-- IMPORTANT: This script uses the first user from auth.users table.
-- Ensure you have suppliers in supplier_database and orders in orders table
-- before running this script.
--
-- To find your user_id:
-- 1. Log into your application
-- 2. Open browser console and run: (await supabase.auth.getUser()).data.user.id
-- 3. Or check Supabase Dashboard > Authentication > Users
--
-- NOTE: If supplier_id or order_id cannot be found, those fields will be NULL.
-- This is acceptable for testing purposes.

-- Insert dummy meeting requests
-- Only inserts rows where at least one supplier or order exists
INSERT INTO public.meeting_requests (
    id,
    supplier_id,
    order_id,
    supplier_name,
    reason,
    meeting_id,
    scheduled_time,
    meeting_link,
    created_at
) VALUES 

-- Meeting Request 1: TechNova Manufacturing - Welding Rods Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'TechNova Manufacturing' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Welding%' OR product_name LIKE '%Rod%' LIMIT 1),
    'TechNova Manufacturing',
    'Need to discuss bulk pricing and delivery timeline for Grade 6061 welding rods. Want to negotiate better terms for orders over 500 pieces.',
    'MEET-2024-001',
    NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
    'https://zoom.us/j/1234567890?pwd=TechNova2024',
    NOW() - INTERVAL '1 day'
),

-- Meeting Request 2: BrightMetal Works - Steel Beams Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'BrightMetal Works' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Steel I-Beams%' LIMIT 1),
    'BrightMetal Works',
    'Follow-up meeting to discuss steel beam specifications and delivery logistics. Need to confirm warehouse capacity and shipping arrangements.',
    'MEET-2024-002',
    NOW() + INTERVAL '3 days' + INTERVAL '14 hours',
    'https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc123def456',
    NOW() - INTERVAL '12 hours'
),

-- Meeting Request 3: BrightMetal Works - Aluminum Sheets Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'BrightMetal Works' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Aluminum Sheets%' LIMIT 1),
    'BrightMetal Works',
    'Review aluminum sheet quality standards and discuss volume discount opportunities for future orders.',
    'MEET-2024-003',
    NOW() + INTERVAL '5 days' + INTERVAL '9 hours',
    'https://meet.google.com/xyz-abc-def',
    NOW() - INTERVAL '6 hours'
),

-- Meeting Request 4: NextGen Components - Electronic Components Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'NextGen Components' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Electronic Components%' LIMIT 1),
    'NextGen Components',
    'Technical discussion about component specifications and compatibility. Need to verify RoHS compliance and lead times.',
    'MEET-2024-004',
    NOW() + INTERVAL '1 week' + INTERVAL '11 hours',
    'https://zoom.us/j/9876543210?pwd=NextGen2024',
    NOW() - INTERVAL '3 hours'
),

-- Meeting Request 5: Global Materials Co - Power Tools Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'Global Materials Co' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Cordless Drill%' LIMIT 1),
    'Global Materials Co',
    'Product demonstration and warranty discussion for cordless drill sets. Want to understand bulk pricing structure.',
    'MEET-2024-005',
    NOW() + INTERVAL '4 days' + INTERVAL '15 hours',
    'https://teams.microsoft.com/l/meetup-join/19%3ameeting_xyz789ghi012',
    NOW() - INTERVAL '8 hours'
),

-- Meeting Request 6: TechNova Manufacturing - Fasteners Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'TechNova Manufacturing' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Hex Bolts%' LIMIT 1),
    'TechNova Manufacturing',
    'Discuss stainless steel grade specifications and marine environment suitability. Need clarification on ASTM standards.',
    'MEET-2024-006',
    NOW() + INTERVAL '6 days' + INTERVAL '13 hours',
    'https://meet.google.com/abc-def-ghi',
    NOW() - INTERVAL '2 days'
),

-- Meeting Request 7: BrightMetal Works - Safety Equipment Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'BrightMetal Works' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Safety Equipment%' LIMIT 1),
    'BrightMetal Works',
    'Safety equipment certification review and compliance discussion. Need to ensure all items meet OSHA requirements.',
    'MEET-2024-007',
    NOW() + INTERVAL '1 week' + INTERVAL '2 days' + INTERVAL '10 hours',
    'https://zoom.us/j/5556667777?pwd=Safety2024',
    NOW() - INTERVAL '1 day'
),

-- Meeting Request 8: NextGen Components - Packaging Materials Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'NextGen Components' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Packaging%' LIMIT 1),
    'NextGen Components',
    'Custom packaging requirements discussion. Need to finalize design specifications and minimum order quantities.',
    'MEET-2024-008',
    NOW() + INTERVAL '3 days' + INTERVAL '16 hours',
    'https://teams.microsoft.com/l/meetup-join/19%3ameeting_packaging123',
    NOW() - INTERVAL '4 hours'
),

-- Meeting Request 9: TechNova Manufacturing - Raw Materials Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'TechNova Manufacturing' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Raw Materials%' LIMIT 1),
    'TechNova Manufacturing',
    'Quarterly review meeting to discuss ongoing supply chain partnership and negotiate annual pricing agreements.',
    'MEET-2024-009',
    NOW() + INTERVAL '2 weeks' + INTERVAL '10 hours',
    'https://meet.google.com/quarterly-review-2024',
    NOW() - INTERVAL '5 days'
),

-- Meeting Request 10: BrightMetal Works - Construction Materials Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'BrightMetal Works' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Construction%' LIMIT 1),
    'BrightMetal Works',
    'Urgent meeting to discuss delivery schedule changes and alternative material options due to supply chain disruptions.',
    'MEET-2024-010',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
    'https://zoom.us/j/1112223333?pwd=Urgent2024',
    NOW() - INTERVAL '2 hours'
),

-- Meeting Request 11: NextGen Components - Industrial Equipment Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'NextGen Components' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Industrial%' LIMIT 1),
    'NextGen Components',
    'Technical consultation for industrial equipment specifications. Need to discuss installation requirements and maintenance schedules.',
    'MEET-2024-011',
    NOW() + INTERVAL '8 days' + INTERVAL '14 hours',
    'https://teams.microsoft.com/l/meetup-join/19%3ameeting_industrial456',
    NOW() - INTERVAL '1 day'
),

-- Meeting Request 12: Global Materials Co - Chemical Supplies Order
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'Global Materials Co' LIMIT 1),
    (SELECT id FROM public.orders WHERE product_name LIKE '%Chemical%' LIMIT 1),
    'Global Materials Co',
    'Safety data sheet review and handling procedures discussion. Need to ensure compliance with environmental regulations.',
    'MEET-2024-012',
    NOW() + INTERVAL '1 week' + INTERVAL '1 day' + INTERVAL '11 hours',
    'https://meet.google.com/chemical-safety-review',
    NOW() - INTERVAL '3 days'
),

-- Meeting Request 13: TechNova Manufacturing - Quality Assurance Meeting
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'TechNova Manufacturing' LIMIT 1),
    (SELECT id FROM public.orders ORDER BY created_at DESC LIMIT 1),
    'TechNova Manufacturing',
    'Quality assurance review meeting to discuss recent order fulfillment and address any concerns about product quality.',
    'MEET-2024-013',
    NOW() + INTERVAL '5 days' + INTERVAL '15 hours',
    'https://zoom.us/j/4445556666?pwd=Quality2024',
    NOW() - INTERVAL '6 hours'
),

-- Meeting Request 14: BrightMetal Works - Payment Terms Discussion
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'BrightMetal Works' LIMIT 1),
    (SELECT id FROM public.orders WHERE status = 'confirmed' LIMIT 1),
    'BrightMetal Works',
    'Payment terms negotiation for large volume orders. Want to discuss extended payment options and early payment discounts.',
    'MEET-2024-014',
    NOW() + INTERVAL '7 days' + INTERVAL '10 hours',
    'https://teams.microsoft.com/l/meetup-join/19%3ameeting_payment789',
    NOW() - INTERVAL '12 hours'
),

-- Meeting Request 15: NextGen Components - Future Partnership Discussion
(
    gen_random_uuid(),
    (SELECT id FROM public.supplier_database WHERE company_name = 'NextGen Components' LIMIT 1),
    (SELECT id FROM public.orders ORDER BY total_price_estimate DESC LIMIT 1),
    'NextGen Components',
    'Strategic partnership discussion for long-term supply agreements. Exploring opportunities for exclusive distribution rights.',
    'MEET-2024-015',
    NOW() + INTERVAL '2 weeks' + INTERVAL '1 day' + INTERVAL '13 hours',
    'https://meet.google.com/strategic-partnership-2024',
    NOW() - INTERVAL '1 week'
);

-- Verify the insertions
SELECT 
    COUNT(*) as total_meetings,
    COUNT(DISTINCT supplier_id) as unique_suppliers,
    COUNT(DISTINCT order_id) as unique_orders
FROM public.meeting_requests;

