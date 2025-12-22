-- Add cash_date column to exchanges table to track when the cash was recorded
ALTER TABLE public.exchanges ADD COLUMN cash_date date DEFAULT CURRENT_DATE;

-- Update existing records to use created_at date as cash_date
UPDATE public.exchanges SET cash_date = DATE(created_at) WHERE cash_date IS NULL;