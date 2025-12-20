-- Update generate_receipt_number to use local timezone (Africa/Kampala - UTC+3)
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  receipt_num TEXT;
  today_date TEXT;
  next_num INTEGER;
BEGIN
  -- Use Africa/Kampala timezone for local date
  today_date := TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Kampala', 'YYYYMMDD');
  
  -- Get the max existing receipt number for today and increment
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(receipt_number FROM 'RCP-' || today_date || '-(\d+)$') 
        AS INTEGER
      )
    ), 0
  ) + 1 INTO next_num
  FROM public.sales
  WHERE receipt_number LIKE 'RCP-' || today_date || '-%';
  
  receipt_num := 'RCP-' || today_date || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN receipt_num;
END;
$function$;

-- Also update generate_order_number to use local timezone for consistency
CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  order_num TEXT;
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM public.purchase_orders
  WHERE DATE(created_at AT TIME ZONE 'Africa/Kampala') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Kampala');
  
  order_num := 'PO-' || TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Kampala', 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN order_num;
END;
$function$;