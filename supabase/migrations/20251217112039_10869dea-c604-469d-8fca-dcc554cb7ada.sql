-- Create credit_sales table to track installment/credit sales
CREATE TABLE public.credit_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  total_amount numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  due_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create credit_payments table to track individual payments
CREATE TABLE public.credit_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_sale_id uuid NOT NULL REFERENCES public.credit_sales(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  payment_date timestamp with time zone NOT NULL DEFAULT now(),
  received_by uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create stock_transfers table to track transfers between locations
CREATE TABLE public.stock_transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id),
  from_location text NOT NULL,
  to_location text NOT NULL,
  quantity integer NOT NULL,
  transferred_by uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_sales
CREATE POLICY "Staff can view credit_sales" ON public.credit_sales
FOR SELECT USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can insert credit_sales" ON public.credit_sales
FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can update credit_sales" ON public.credit_sales
FOR UPDATE USING (is_staff_or_admin(auth.uid()));

-- RLS policies for credit_payments
CREATE POLICY "Staff can view credit_payments" ON public.credit_payments
FOR SELECT USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can insert credit_payments" ON public.credit_payments
FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

-- RLS policies for stock_transfers
CREATE POLICY "Staff can view stock_transfers" ON public.stock_transfers
FOR SELECT USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can insert stock_transfers" ON public.stock_transfers
FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

-- Add trigger for updated_at on credit_sales
CREATE TRIGGER update_credit_sales_updated_at
BEFORE UPDATE ON public.credit_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();