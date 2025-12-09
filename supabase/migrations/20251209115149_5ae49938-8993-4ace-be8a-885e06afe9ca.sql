
-- Create table to store page permissions for each user
CREATE TABLE public.page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, page_path)
);

-- Enable RLS
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage page permissions
CREATE POLICY "Admins can view all page_permissions" 
ON public.page_permissions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert page_permissions" 
ON public.page_permissions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update page_permissions" 
ON public.page_permissions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete page_permissions" 
ON public.page_permissions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Function to check if user has access to a specific page
CREATE OR REPLACE FUNCTION public.has_page_access(_user_id uuid, _page_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Admins have access to all pages
  SELECT CASE 
    WHEN has_role(_user_id, 'admin') THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.page_permissions
      WHERE user_id = _user_id AND page_path = _page_path
    )
  END
$$;
