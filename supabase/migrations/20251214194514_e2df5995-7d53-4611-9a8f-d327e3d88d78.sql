-- Create site_settings table for admin-controlled site appearance
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view site settings (needed for public site rendering)
CREATE POLICY "Anyone can view site_settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can modify site settings
CREATE POLICY "Admins can insert site_settings"
ON public.site_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site_settings"
ON public.site_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site_settings"
ON public.site_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
('theme', '{"primaryColor": "#f97316", "accentColor": "#1e3a5f", "logoUrl": "", "siteName": "Fady Technologies"}'::jsonb),
('hero', '{"title": "Premium Network Equipment", "subtitle": "Quality networking solutions for businesses and professionals", "imageUrl": "", "ctaText": "Shop Now", "ctaLink": "/products"}'::jsonb),
('categories', '{"visible": ["Routers", "Switches", "Cables", "Servers", "Phones", "Laptops", "Furniture"], "order": []}'::jsonb);

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();