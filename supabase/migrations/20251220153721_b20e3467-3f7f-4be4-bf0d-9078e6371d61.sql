-- Enable realtime for credit_sales and credit_payments tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_payments;