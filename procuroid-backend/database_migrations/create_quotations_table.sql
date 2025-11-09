-- Create quotations table
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.supplier_database(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    quotation_data JSONB NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending_approval',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT valid_status CHECK (status IN ('pending_approval', 'approved', 'rejected', 'declined'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON public.quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_supplier_id ON public.quotations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.quotations(created_at);

-- Enable Row Level Security
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own quotations
CREATE POLICY "Users can view own quotations" ON public.quotations
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policy: Users can insert their own quotations
CREATE POLICY "Users can insert own quotations" ON public.quotations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create policy: Users can update their own quotations
CREATE POLICY "Users can update own quotations" ON public.quotations
    FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Add comment to table
COMMENT ON TABLE public.quotations IS 'Stores supplier quotations awaiting approval';
COMMENT ON COLUMN public.quotations.quotation_data IS 'JSON object containing price, delivery_time, payment_terms, quantity, etc.';

