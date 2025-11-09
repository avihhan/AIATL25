-- Insert dummy orders data for testing
-- This script creates a variety of orders with different statuses, products, and dates
-- 
-- IMPORTANT: This script uses the first user from auth.users table.
-- If you want to assign orders to a specific user, replace (SELECT id FROM auth.users LIMIT 1)
-- with your user_id UUID, or run the UPDATE query at the end to reassign all orders.
--
-- To find your user_id:
-- 1. Log into your application
-- 2. Open browser console and run: (await supabase.auth.getUser()).data.user.id
-- 3. Or check Supabase Dashboard > Authentication > Users

-- Ensure quantity column exists (in case it doesn't)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN quantity NUMERIC;
        -- Copy from quantity_required if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'orders' 
            AND column_name = 'quantity_required'
        ) THEN
            UPDATE public.orders SET quantity = quantity_required WHERE quantity IS NULL;
        END IF;
    END IF;
END $$;

-- Insert dummy orders
INSERT INTO public.orders (
    user_id,
    supplier_type,
    product_name,
    product_description,
    product_specifications,
    product_certification,
    quantity,
    quantity_required,
    unit_of_measurement,
    unit_price,
    lower_limit,
    upper_limit,
    currency,
    total_price_estimate,
    payment_terms,
    preferred_payment_method,
    required_delivery_date,
    delivery_location,
    shipping_cost,
    packaging_details,
    incoterms,
    status,
    created_at,
    updated_at
) VALUES 

-- Order 1: Pending - Welding Rods
(
    (SELECT id FROM auth.users LIMIT 1),
    'manufacturer',
    'Grade 6061 Aluminum Welding Rods',
    'High-quality aluminum welding rods suitable for structural applications. ISO certified with excellent corrosion resistance.',
    'Grade: 6061-T6\nDiameter: 3/32 inch\nLength: 36 inches\nTensile Strength: 45,000 PSI',
    'ISO 9001:2015, AWS A5.10',
    200,
    200,
    'pieces',
    12.50,
    2000.00,
    3000.00,
    'USD',
    2500.00,
    'Net 30',
    'Wire Transfer',
    CURRENT_DATE + INTERVAL '3 weeks',
    '1234 Industrial Blvd, Atlanta, GA 30318',
    'separate',
    'Standard cardboard boxes, 50 pieces per box. Fragile handling required.',
    'FOB',
    'pending',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
),

-- Order 2: Submitted - Steel Beams
(
    (SELECT id FROM auth.users LIMIT 1),
    'manufacturer',
    '12ft Structural Steel I-Beams',
    'Structural steel I-beams for construction projects. Hot-rolled, ASTM A36 grade.',
    'Length: 12 feet\nWidth: 6 inches\nHeight: 8 inches\nWeight: 42 lbs/ft\nMaterial: ASTM A36',
    'ASTM A36, AISC Certified',
    12,
    12,
    'beams',
    280.00,
    3000.00,
    4000.00,
    'USD',
    3360.00,
    'Net 15',
    'Letter of Credit',
    CURRENT_DATE + INTERVAL '4 weeks',
    '456 Construction Way, Atlanta, GA 30309',
    'included',
    'Individual wrapping with protective coating. Heavy-duty strapping required.',
    'CIF',
    'submitted',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '2 days'
),

-- Order 3: Confirmed - Aluminum Sheets
(
    (SELECT id FROM auth.users LIMIT 1),
    'distributor',
    '4x8 Aluminum Sheets - 0.125 inch',
    'Premium aluminum sheets for fabrication. Mill finish, ready for anodizing or painting.',
    'Size: 4ft x 8ft\nThickness: 0.125 inch (1/8")\nAlloy: 3003-H14\nFinish: Mill',
    'RoHS Compliant',
    100,
    100,
    'sheets',
    18.75,
    1500.00,
    2500.00,
    'USD',
    1875.00,
    'Net 30',
    'Wire Transfer',
    CURRENT_DATE + INTERVAL '2 weeks',
    '789 Manufacturing Drive, Atlanta, GA 30313',
    'separate',
    'Flat stacking with protective interleaving. Minimum 10 sheets per pallet.',
    'FOB',
    'confirmed',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
),

-- Order 4: In Progress - Electronic Components
(
    (SELECT id FROM auth.users LIMIT 1),
    'distributor',
    'Microcontroller Development Boards',
    'STM32F4 development boards with ARM Cortex-M4 processor. Includes USB, Ethernet, and various I/O interfaces.',
    'MCU: STM32F407VGT6\nClock: 168 MHz\nFlash: 1MB\nRAM: 192KB\nInterfaces: USB, Ethernet, CAN, SPI, I2C, UART',
    'CE, FCC, RoHS',
    50,
    50,
    'units',
    45.00,
    2000.00,
    3000.00,
    'USD',
    2250.00,
    'Net 20',
    'Credit Card',
    CURRENT_DATE + INTERVAL '1 week',
    '321 Tech Park Blvd, Atlanta, GA 30308',
    'included',
    'Anti-static bags, individual board protection. ESD-safe packaging required.',
    'EXW',
    'in_progress',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 day'
),

-- Order 5: Shipped - Packaging Materials
(
    (SELECT id FROM auth.users LIMIT 1),
    'service_provider',
    'Eco-Friendly Corrugated Boxes',
    'Custom-sized corrugated cardboard boxes. Recyclable, FSC certified materials.',
    'Material: Double-wall corrugated\nWeight Capacity: 50 lbs\nCustom printing available\nSizes: Various (specify requirements)',
    'FSC Certified, Recyclable',
    500,
    500,
    'boxes',
    3.50,
    1500.00,
    2000.00,
    'USD',
    1750.00,
    'Net 30',
    'Check',
    CURRENT_DATE + INTERVAL '5 days',
    '654 Warehouse Row, Atlanta, GA 30310',
    'included',
    'Nested stacking. Weather-resistant outer wrapping for outdoor storage.',
    'DDP',
    'shipped',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '2 hours'
),

-- Order 6: Delivered - Power Tools
(
    (SELECT id FROM auth.users LIMIT 1),
    'manufacturer',
    'Professional Cordless Drill Set',
    'Heavy-duty cordless drill with brushless motor. Includes 2 batteries, charger, and carrying case.',
    'Voltage: 20V\nTorque: 450 in-lbs\nChuck: 1/2 inch\nBatteries: 2x 4.0Ah Li-ion\nCharger: Fast charger included',
    'UL Listed, ETL Certified',
    15,
    15,
    'units',
    189.99,
    2500.00,
    3500.00,
    'USD',
    2849.85,
    'Net 30',
    'Wire Transfer',
    CURRENT_DATE - INTERVAL '3 days',
    '987 Tool Center Lane, Atlanta, GA 30311',
    'included',
    'Original manufacturer packaging. Individual boxes with foam padding.',
    'CIF',
    'delivered',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '3 days'
),

-- Order 7: Pending - Industrial Fasteners
(
    (SELECT id FROM auth.users LIMIT 1),
    'distributor',
    'Stainless Steel Hex Bolts - Grade 316',
    'Marine-grade stainless steel hex bolts. Excellent corrosion resistance for harsh environments.',
    'Grade: 316 Stainless Steel\nSize: 1/2" x 4"\nThread: Coarse\nFinish: Plain\nHead: Hex',
    'ASTM A193, ISO 4014',
    1000,
    1000,
    'pieces',
    0.85,
    700.00,
    1000.00,
    'USD',
    850.00,
    'Net 30',
    'Wire Transfer',
    CURRENT_DATE + INTERVAL '2 weeks',
    '147 Hardware Street, Atlanta, GA 30312',
    'separate',
    'Bulk packaging in sealed bags. 100 pieces per bag.',
    'FOB',
    'pending',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),

-- Order 8: Submitted - Hydraulic Components
(
    (SELECT id FROM auth.users LIMIT 1),
    'manufacturer',
    'Hydraulic Cylinder - 6 inch Bore',
    'Double-acting hydraulic cylinder for industrial applications. High-pressure rated with integrated position sensor.',
    'Bore: 6 inches\nStroke: 24 inches\nPressure: 3000 PSI\nPort Size: 1-1/4" NPT\nMounting: Clevis',
    'ISO 6020/2, NFPA Standard',
    8,
    8,
    'units',
    1250.00,
    9000.00,
    12000.00,
    'USD',
    10000.00,
    'Net 45',
    'Letter of Credit',
    CURRENT_DATE + INTERVAL '6 weeks',
    '258 Industrial Complex, Atlanta, GA 30314',
    'separate',
    'Individual crates with protective padding. Heavy machinery handling required.',
    'CIF',
    'submitted',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '3 days'
),

-- Order 9: Confirmed - Safety Equipment
(
    (SELECT id FROM auth.users LIMIT 1),
    'distributor',
    'Hard Hats with Face Shield - ANSI Type I',
    'Professional safety hard hats with integrated face shield. Adjustable suspension system.',
    'Standard: ANSI Z89.1 Type I, Class C\nMaterial: High-density polyethylene\nColor: Yellow\nSuspension: 6-point ratchet\nFace Shield: Polycarbonate, anti-fog',
    'ANSI Z89.1, CSA Z94.1',
    75,
    75,
    'units',
    28.50,
    1800.00,
    2500.00,
    'USD',
    2137.50,
    'Net 30',
    'Credit Card',
    CURRENT_DATE + INTERVAL '1 week',
    '369 Safety Supply Ave, Atlanta, GA 30315',
    'included',
    'Individual poly bags. Bulk carton packaging, 12 units per carton.',
    'FOB',
    'confirmed',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '12 hours'
),

-- Order 10: In Progress - Office Furniture
(
    (SELECT id FROM auth.users LIMIT 1),
    'service_provider',
    'Ergonomic Office Chairs - Executive Model',
    'High-back executive office chairs with lumbar support. Adjustable height, armrests, and tilt mechanism.',
    'Material: Mesh back, leather seat\nWeight Capacity: 300 lbs\nAdjustments: Height, tilt, armrest height\nWarranty: 5 years\nColor: Black',
    'BIFMA Certified, GREENGUARD Gold',
    25,
    25,
    'units',
    299.00,
    6000.00,
    9000.00,
    'USD',
    7475.00,
    'Net 30',
    'Wire Transfer',
    CURRENT_DATE + INTERVAL '3 weeks',
    '741 Business Park Drive, Atlanta, GA 30316',
    'included',
    'Original manufacturer boxes. Assembly required (tools included).',
    'DDP',
    'in_progress',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '1 day'
),

-- Order 11: Shipped - Raw Materials
(
    (SELECT id FROM auth.users LIMIT 1),
    'manufacturer',
    'Copper Wire - 12 AWG, 500ft Spools',
    'Stranded copper wire for electrical applications. THHN/THWN-2 rated.',
    'Gauge: 12 AWG
Conductor: Stranded copper
Insulation: THHN/THWN-2
Voltage: 600V
Temperature: 90°C dry, 75°C wet
Length: 500 feet per spool',
    'UL Listed, CSA Certified',
    20,
    20,
    'spools',
    125.00,
    2000.00,
    3000.00,
    'USD',
    2500.00,
    'Net 30',
    'Wire Transfer',
    CURRENT_DATE + INTERVAL '2 days',
    '852 Electrical Supply Road, Atlanta, GA 30317',
    'separate',
    'Individual spool packaging. Weather-resistant wrapping for outdoor storage.',
    'FOB',
    'shipped',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '4 hours'
),

-- Order 12: Delivered - Laboratory Equipment
(
    (SELECT id FROM auth.users LIMIT 1),
    'distributor',
    'Digital Precision Balance - 0.1mg Accuracy',
    'Laboratory-grade analytical balance with internal calibration. Touchscreen interface and data export capabilities.',
    'Capacity: 220g
Readability: 0.1mg
Calibration: Internal (automatic)
Interface: USB, RS-232
Display: 5.7" color touchscreen
Units: g, kg, oz, lb, ct, dwt',
    'ISO 9001, NIST Traceable',
    5,
    5,
    'units',
    895.00,
    4000.00,
    5000.00,
    'USD',
    4475.00,
    'Net 30',
    'Wire Transfer',
    CURRENT_DATE - INTERVAL '5 days',
    '963 Research Boulevard, Atlanta, GA 30318',
    'included',
    'Original manufacturer packaging with foam padding. Calibration certificate included.',
    'CIF',
    'delivered',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '5 days'
);

-- Verify the insertions
SELECT 
    id,
    product_name,
    status,
    quantity,
    unit_of_measurement,
    total_price_estimate,
    currency,
    user_id,
    created_at,
    updated_at
FROM public.orders
ORDER BY created_at DESC;

-- ============================================================================
-- OPTIONAL: Update all dummy orders to use your current user_id
-- ============================================================================
-- If the orders don't show up, they might be assigned to a different user.
-- To reassign all dummy orders to your current user, run this query:
--
-- UPDATE public.orders
-- SET user_id = 'YOUR_USER_ID_HERE'  -- Replace with your actual user_id UUID
-- WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
--   AND created_at >= NOW() - INTERVAL '1 hour';  -- Only update recently created orders
--
-- Or to reassign to the most recently created user:
-- UPDATE public.orders
-- SET user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
-- WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
--   AND created_at >= NOW() - INTERVAL '1 hour';
--
-- ============================================================================
-- ALTERNATIVE: Insert orders for ALL users (if you have multiple test users)
-- ============================================================================
-- If you want to create orders for all users in your database, you can use:
--
-- INSERT INTO public.orders (...)
-- SELECT 
--     u.id as user_id,  -- Use each user's ID
--     'Product Name',
--     ...
-- FROM auth.users u
-- CROSS JOIN (VALUES 
--     ('Product 1', ...),
--     ('Product 2', ...)
-- ) AS products(...);

