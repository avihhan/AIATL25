-- Fix the quantity column issue in orders table
-- This migration ensures both quantity and quantity_required columns exist and are properly set

-- Add quantity column if it doesn't exist (some tables might have been created with this name)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'quantity'
    ) THEN
        -- If quantity doesn't exist, create it and populate from quantity_required
        ALTER TABLE public.orders ADD COLUMN quantity NUMERIC;
        
        -- Copy data from quantity_required to quantity if quantity_required exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'orders' 
            AND column_name = 'quantity_required'
        ) THEN
            UPDATE public.orders SET quantity = quantity_required WHERE quantity IS NULL;
        END IF;
        
        -- Make it NOT NULL after populating
        ALTER TABLE public.orders ALTER COLUMN quantity SET NOT NULL;
    ELSE
        -- If quantity exists, ensure it's NOT NULL and has a default
        ALTER TABLE public.orders ALTER COLUMN quantity SET NOT NULL;
        ALTER TABLE public.orders ALTER COLUMN quantity SET DEFAULT 0;
        
        -- Update any null values
        UPDATE public.orders SET quantity = COALESCE(quantity, 0) WHERE quantity IS NULL;
    END IF;
END $$;

-- Ensure quantity_required also exists (for consistency)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'quantity_required'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN quantity_required NUMERIC;
        
        -- Copy data from quantity to quantity_required if quantity exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'orders' 
            AND column_name = 'quantity'
        ) THEN
            UPDATE public.orders SET quantity_required = quantity WHERE quantity_required IS NULL;
        END IF;
    END IF;
END $$;

