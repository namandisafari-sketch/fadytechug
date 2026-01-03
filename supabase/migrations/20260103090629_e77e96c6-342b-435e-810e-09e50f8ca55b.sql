
-- Create customer_wallets table to track balances
CREATE TABLE public.customer_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

-- Create wallet_transactions table to track all wallet activity
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'purchase', 'refund')),
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  sale_id uuid REFERENCES public.sales(id),
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_wallets
CREATE POLICY "Staff can view customer_wallets"
ON public.customer_wallets FOR SELECT
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can insert customer_wallets"
ON public.customer_wallets FOR INSERT
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can update customer_wallets"
ON public.customer_wallets FOR UPDATE
USING (is_staff_or_admin(auth.uid()));

-- RLS policies for wallet_transactions
CREATE POLICY "Staff can view wallet_transactions"
ON public.wallet_transactions FOR SELECT
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can insert wallet_transactions"
ON public.wallet_transactions FOR INSERT
WITH CHECK (is_staff_or_admin(auth.uid()));

-- Add trigger to update updated_at
CREATE TRIGGER update_customer_wallets_updated_at
BEFORE UPDATE ON public.customer_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
