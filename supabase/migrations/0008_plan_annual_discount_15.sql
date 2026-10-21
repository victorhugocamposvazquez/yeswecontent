-- Precio anual = mensual con 15 % de descuento (yearly_price_eur sigue siendo €/mes en facturación anual).
update public.plans
set yearly_price_eur = round(monthly_price_eur * 0.85)::integer
where monthly_price_eur > 0;
