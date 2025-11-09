-- This migration adds any missing columns to the orders table
-- Run this if you get schema cache errors or missing column errors

-- Add currency column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;
END $$;

-- Add any other missing columns that might be needed
DO $$ 
BEGIN
    -- Add supplier_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'supplier_type'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN supplier_type TEXT CHECK (supplier_type IN ('manufacturer', 'distributor', 'service_provider'));
    END IF;

    -- Add product_name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'product_name'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN product_name TEXT NOT NULL DEFAULT '';
    END IF;

    -- Add product_description if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'product_description'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN product_description TEXT;
    END IF;

    -- Add product_specifications if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'product_specifications'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN product_specifications TEXT;
    END IF;

    -- Add product_certification if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'product_certification'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN product_certification TEXT;
    END IF;

    -- Add quantity_required if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'quantity_required'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN quantity_required NUMERIC NOT NULL DEFAULT 0;
    END IF;

    -- Add unit_of_measurement if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'unit_of_measurement'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN unit_of_measurement TEXT NOT NULL DEFAULT '';
    END IF;

    -- Add unit_price if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN unit_price NUMERIC;
    END IF;

    -- Add lower_limit if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'lower_limit'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN lower_limit NUMERIC;
    END IF;

    -- Add upper_limit if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'upper_limit'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN upper_limit NUMERIC;
    END IF;

    -- Add total_price_estimate if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'total_price_estimate'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN total_price_estimate NUMERIC;
    END IF;

    -- Add payment_terms if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'payment_terms'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN payment_terms TEXT;
    END IF;

    -- Add preferred_payment_method if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'preferred_payment_method'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN preferred_payment_method TEXT;
    END IF;

    -- Add required_delivery_date if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'required_delivery_date'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN required_delivery_date DATE;
    END IF;

    -- Add delivery_location if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'delivery_location'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN delivery_location TEXT;
    END IF;

    -- Add shipping_cost if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'shipping_cost'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN shipping_cost TEXT CHECK (shipping_cost IN ('included', 'separate'));
    END IF;

    -- Add packaging_details if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'packaging_details'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN packaging_details TEXT;
    END IF;

    -- Add incoterms if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'incoterms'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN incoterms TEXT;
    END IF;

    -- Add status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'confirmed', 'in_progress', 'shipped', 'delivered', 'cancelled'));
    END IF;

    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

