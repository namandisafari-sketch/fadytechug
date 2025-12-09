-- Create serial_units table for individual unit tracking
CREATE TABLE public.serial_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_stock',
  condition TEXT DEFAULT 'new',
  location TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC,
  warranty_start_date DATE,
  warranty_end_date DATE,
  sold_date DATE,
  sale_id UUID REFERENCES public.sales(id),
  customer_id UUID REFERENCES public.customers(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, serial_number)
);

-- Create serial_unit_history table for tracking changes
CREATE TABLE public.serial_unit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_unit_id UUID NOT NULL REFERENCES public.serial_units(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  previous_location TEXT,
  new_location TEXT,
  notes TEXT,
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.serial_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_unit_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for serial_units
CREATE POLICY "Staff can view serial_units" ON public.serial_units
  FOR SELECT USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can insert serial_units" ON public.serial_units
  FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can update serial_units" ON public.serial_units
  FOR UPDATE USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Admins can delete serial_units" ON public.serial_units
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS policies for serial_unit_history
CREATE POLICY "Staff can view serial_unit_history" ON public.serial_unit_history
  FOR SELECT USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can insert serial_unit_history" ON public.serial_unit_history
  FOR INSERT WITH CHECK (is_staff_or_admin(auth.uid()));

-- Indexes
CREATE INDEX idx_serial_units_product ON public.serial_units(product_id);
CREATE INDEX idx_serial_units_status ON public.serial_units(status);
CREATE INDEX idx_serial_units_serial ON public.serial_units(serial_number);
CREATE INDEX idx_serial_unit_history_unit ON public.serial_unit_history(serial_unit_id);

-- Trigger for updated_at
CREATE TRIGGER update_serial_units_updated_at
  BEFORE UPDATE ON public.serial_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();