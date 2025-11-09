-- Fix quotations table foreign key constraint
-- Run this if the table already exists and you're getting foreign key errors

-- First, drop the existing foreign key constraint if it exists
DO $$
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'quotations_supplier_id_fkey'
        AND table_name = 'quotations'
    ) THEN
        ALTER TABLE public.quotations 
        DROP CONSTRAINT quotations_supplier_id_fkey;
    END IF;
END $$;

-- Add the foreign key constraint with ON DELETE SET NULL
-- This allows supplier_id to be NULL if supplier doesn't exist or is deleted
ALTER TABLE public.quotations
ADD CONSTRAINT quotations_supplier_id_fkey 
FOREIGN KEY (supplier_id) 
REFERENCES public.supplier_database(id) 
ON DELETE SET NULL;

-- Ensure supplier_id can be NULL
ALTER TABLE public.quotations
ALTER COLUMN supplier_id DROP NOT NULL;

