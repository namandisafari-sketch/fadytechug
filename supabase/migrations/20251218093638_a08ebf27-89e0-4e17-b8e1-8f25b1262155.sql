-- Drop and recreate the generate_receipt_number function with retry logic for race conditions
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
  today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
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