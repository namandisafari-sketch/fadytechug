
-- Add payment_source enum type
CREATE TYPE public.payment_source AS ENUM ('cash_register', 'bank');

-- Add payment_source column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN payment_source payment_source NOT NULL DEFAULT 'cash_register';

-- Add payment_source column to supplier_payments table
ALTER TABLE public.supplier_payments 
ADD COLUMN payment_source payment_source NOT NULL DEFAULT 'bank';

-- Add comment for documentation
COMMENT ON COLUMN public.expenses.payment_source IS 'Indicates whether expense was paid from cash register or bank account';
COMMENT ON COLUMN public.supplier_payments.payment_source IS 'Indicates whether supplier payment was made from cash register or bank account';
