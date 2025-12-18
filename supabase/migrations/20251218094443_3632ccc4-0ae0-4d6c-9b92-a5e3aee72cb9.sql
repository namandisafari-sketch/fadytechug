-- Allow admins to delete sales records
CREATE POLICY "Admins can delete sales" 
ON public.sales 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete sale_items (needed when deleting a sale)
CREATE POLICY "Admins can delete sale_items" 
ON public.sale_items 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete refunds associated with a sale
CREATE POLICY "Admins can delete refunds" 
ON public.refunds 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));