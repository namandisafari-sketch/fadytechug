-- Create exchanges table for tracking product exchanges/swaps
CREATE TABLE public.exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_sale_id UUID REFERENCES public.sales(id),
  original_receipt_number TEXT NOT NULL,
  customer_name TEXT,
  exchange_type TEXT NOT NULL DEFAULT 'exchange', -- 'exchange' or 'refund'
  
  -- Returned items
  returned_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  returned_value NUMERIC NOT NULL DEFAULT 0,
  
  -- New items (for exchanges)
  new_items JSONB DEFAULT '[]'::jsonb,
  new_value NUMERIC DEFAULT 0,
  
  -- Financial details
  difference_amount NUMERIC DEFAULT 0, -- positive = customer pays, negative = shop refunds
  payment_method TEXT DEFAULT 'cash',
  amount_paid NUMERIC DEFAULT 0, -- top-up paid by customer
  refund_given NUMERIC DEFAULT 0, -- refund if new items cost less
  
  reason TEXT NOT NULL,
  notes TEXT,
  
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Staff can view exchanges" ON public.exchanges
  FOR SELECT USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can insert exchanges" ON public.exchanges
  FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can update exchanges" ON public.exchanges
  FOR UPDATE USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Admins can delete exchanges" ON public.exchanges
  FOR DELETE USING (has_role(auth.uid(), 'admin'));