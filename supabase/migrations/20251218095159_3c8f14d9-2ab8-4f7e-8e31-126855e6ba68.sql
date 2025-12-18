-- Add soft delete column to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add soft delete column to refunds table  
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster queries on non-deleted records
CREATE INDEX IF NOT EXISTS idx_sales_deleted_at ON public.sales(deleted_at);
CREATE INDEX IF NOT EXISTS idx_refunds_deleted_at ON public.refunds(deleted_at);