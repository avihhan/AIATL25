-- Insert dummy orders for the CURRENT logged-in user
-- This script should be run while logged into Supabase SQL Editor
-- It uses auth.uid() to get the current user's ID
--
-- NOTE: This only works if you're running it in Supabase SQL Editor while logged in
-- If you're using a service role or admin client, use the other script instead

-- Ensure quantity column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN quantity NUMERIC;
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

-- Insert dummy orders for current user
-- This uses auth.uid() which gets the current logged-in user's ID
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
    auth.uid(),  -- Use current user's ID
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
    auth.uid(),
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
    auth.uid(),
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
    auth.uid(),
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
    auth.uid(),
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
    auth.uid(),
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
    created_at
FROM public.orders
WHERE user_id = auth.uid()  -- Show orders for current user
ORDER BY created_at DESC;

