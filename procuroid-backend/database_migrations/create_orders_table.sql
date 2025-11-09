-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Supplier Details
    supplier_type TEXT CHECK (supplier_type IN ('manufacturer', 'distributor', 'service_provider')),
    product_name TEXT NOT NULL,
    product_description TEXT,
    product_specifications TEXT,
    product_certification TEXT,
    
    -- Order Details
    quantity_required NUMERIC NOT NULL,
    unit_of_measurement TEXT NOT NULL,
    unit_price NUMERIC,
    lower_limit NUMERIC,
    upper_limit NUMERIC,
    currency TEXT DEFAULT 'USD',
    total_price_estimate NUMERIC,
    
    -- Delivery & Payment
    payment_terms TEXT,
    preferred_payment_method TEXT,
    required_delivery_date DATE,
    delivery_location TEXT,
    shipping_cost TEXT CHECK (shipping_cost IN ('included', 'separate')),
    packaging_details TEXT,
    incoterms TEXT,
    
    -- Order Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'confirmed', 'in_progress', 'shipped', 'delivered', 'cancelled')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_product_name ON public.orders(product_name);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON public.orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own orders
CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy: Users can delete their own orders
CREATE POLICY "Users can delete own orders" ON public.orders
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE public.orders IS 'Stores order information for users';
COMMENT ON COLUMN public.orders.status IS 'Order status: pending, submitted, confirmed, in_progress, shipped, delivered, cancelled';

