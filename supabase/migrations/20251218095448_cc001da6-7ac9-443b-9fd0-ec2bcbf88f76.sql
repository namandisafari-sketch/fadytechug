-- Allow staff to update refunds (for soft delete)
CREATE POLICY "Staff can update refunds" 
ON public.refunds 
FOR UPDATE 
USING (is_staff_or_admin(auth.uid()));