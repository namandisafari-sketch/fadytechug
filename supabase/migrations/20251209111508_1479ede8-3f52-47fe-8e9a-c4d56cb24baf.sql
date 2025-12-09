-- Add barcode column to products table for barcode scanning in POS
ALTER TABLE public.products ADD COLUMN barcode TEXT;

-- Create index for faster barcode lookups
CREATE INDEX idx_products_barcode ON public.products(barcode);