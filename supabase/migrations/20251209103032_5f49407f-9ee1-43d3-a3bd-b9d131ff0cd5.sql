
-- Create expense categories enum
CREATE TYPE public.expense_category AS ENUM ('utilities', 'rent', 'salaries', 'supplies', 'transport', 'marketing', 'maintenance', 'other');

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'mobile_money', 'bank_transfer', 'credit');

-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('sale', 'purchase', 'adjustment', 'return', 'damage');

-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  change_given NUMERIC DEFAULT 0,
  notes TEXT,
  sold_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sale items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Refunds table
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id),
  receipt_number TEXT NOT NULL,
  reason TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  items_returned JSONB,
  refunded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory transactions table
CREATE TABLE public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  transaction_type transaction_type NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  unit_cost NUMERIC,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Purchase orders from suppliers
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  ordered_by UUID REFERENCES auth.users(id),
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Purchase order items
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bank deposits table
CREATE TABLE public.bank_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  deposit_date DATE NOT NULL,
  reference_number TEXT,
  notes TEXT,
  deposited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cash register table (tracks daily cash)
CREATE TABLE public.cash_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  total_sales NUMERIC DEFAULT 0,
  total_refunds NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  total_deposits NUMERIC DEFAULT 0,
  closing_balance NUMERIC DEFAULT 0,
  closed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff access
CREATE POLICY "Staff can view suppliers" ON public.suppliers FOR SELECT USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can update suppliers" ON public.suppliers FOR UPDATE USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view sales" ON public.sales FOR SELECT USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can insert sales" ON public.sales FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can update sales" ON public.sales FOR UPDATE USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can view sale_items" ON public.sale_items FOR SELECT USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can insert sale_items" ON public.sale_items FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can view refunds" ON public.refunds FOR SELECT USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can insert refunds" ON public.refunds FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can view inventory_transactions" ON public.inventory_transactions FOR SELECT USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can insert inventory_transactions" ON public.inventory_transactions FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can view purchase_orders" ON public.purchase_orders FOR SELECT USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can insert purchase_orders" ON public.purchase_orders FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can update purchase_orders" ON public.purchase_orders FOR UPDATE USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can view purchase_order_items" ON public.purchase_order_items FOR SELECT USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can insert purchase_order_items" ON public.purchase_order_items FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can view expenses" ON public.expenses FOR SELECT USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can insert expenses" ON public.expenses FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));
CREATE POLICY "Admins can delete expenses" ON public.expenses FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view bank_deposits" ON public.bank_deposits FOR SELECT USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can insert bank_deposits" ON public.bank_deposits FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can view cash_register" ON public.cash_register FOR SELECT USING (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can manage cash_register" ON public.cash_register FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));
CREATE POLICY "Staff can update cash_register" ON public.cash_register FOR UPDATE USING (is_staff_or_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cash_register_updated_at BEFORE UPDATE ON public.cash_register FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  receipt_num TEXT;
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM public.sales
  WHERE DATE(created_at) = CURRENT_DATE;
  
  receipt_num := 'RCP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN receipt_num;
END;
$$;

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  order_num TEXT;
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM public.purchase_orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  order_num := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN order_num;
END;
$$;
