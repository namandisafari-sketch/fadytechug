-- Add comprehensive inventory management fields to products table
ALTER TABLE public.products 
ADD COLUMN model TEXT,
ADD COLUMN manufacturer TEXT,
ADD COLUMN sku TEXT,
ADD COLUMN reorder_level INTEGER DEFAULT 5,
ADD COLUMN reorder_quantity INTEGER DEFAULT 10,
ADD COLUMN location TEXT,
ADD COLUMN condition TEXT DEFAULT 'new',
ADD COLUMN serial_numbers TEXT[],
ADD COLUMN warranty_months INTEGER,
ADD COLUMN unit_cost NUMERIC DEFAULT 0,
ADD COLUMN weight_kg NUMERIC,
ADD COLUMN dimensions TEXT;

-- Create indexes for faster lookups
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_model ON public.products(model);
CREATE INDEX idx_products_manufacturer ON public.products(manufacturer);