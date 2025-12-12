-- Create supplier_payments table
CREATE TABLE public.supplier_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  bank_name TEXT,
  reference_number TEXT,
  notes TEXT,
  paid_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Staff can view supplier_payments" 
ON public.supplier_payments 
FOR SELECT 
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can insert supplier_payments" 
ON public.supplier_payments 
FOR INSERT 
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Admins can delete supplier_payments" 
ON public.supplier_payments 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));