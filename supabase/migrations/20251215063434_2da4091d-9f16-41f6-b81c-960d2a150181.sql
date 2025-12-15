-- Create storage_locations table for inventory management
CREATE TABLE public.storage_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view storage_locations" 
ON public.storage_locations FOR SELECT 
USING (true);

CREATE POLICY "Staff can insert storage_locations" 
ON public.storage_locations FOR INSERT 
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff can update storage_locations" 
ON public.storage_locations FOR UPDATE 
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Admins can delete storage_locations" 
ON public.storage_locations FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_storage_locations_updated_at
BEFORE UPDATE ON public.storage_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();