-- Add supplier_id column to products table
ALTER TABLE public.products 
ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Create index for faster supplier lookups
CREATE INDEX idx_products_supplier_id ON public.products(supplier_id);