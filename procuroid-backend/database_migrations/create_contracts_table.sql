-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.supplier_database(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    contract_data JSONB NOT NULL,
    pdf_url TEXT NOT NULL,
    pdf_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'terminated', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_quotation_id ON public.contracts(quotation_id);
CREATE INDEX IF NOT EXISTS idx_contracts_supplier_id ON public.contracts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON public.contracts(created_at);

-- Enable Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own contracts
CREATE POLICY "Users can view own contracts" ON public.contracts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own contracts
CREATE POLICY "Users can insert own contracts" ON public.contracts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own contracts
CREATE POLICY "Users can update own contracts" ON public.contracts
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE public.contracts IS 'Stores contract PDFs generated from approved quotations';
COMMENT ON COLUMN public.contracts.contract_data IS 'JSON object containing the original contract data used to generate the PDF';
COMMENT ON COLUMN public.contracts.pdf_url IS 'Public URL to access the contract PDF from Supabase storage';
COMMENT ON COLUMN public.contracts.pdf_path IS 'Path to the contract PDF in Supabase storage bucket';

