-- Add supplier_id column to serial_units (replacing warranty concept)
ALTER TABLE public.serial_units ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id);

-- Drop warranty columns
ALTER TABLE public.serial_units DROP COLUMN IF EXISTS warranty_start_date;
ALTER TABLE public.serial_units DROP COLUMN IF EXISTS warranty_end_date;