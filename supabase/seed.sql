-- Planes de yeswecontent (precios en céntimos de euro)
insert into public.plans (id, name, monthly_price_eur, yearly_price_eur, articles_per_month, tracked_prompts, languages, seats, social_cadence, backlink_credits, features, sort) values
  ('semilla', 'Semilla', 7900, 3900, 20, 10, 1, 1, 'weekly', 20,
   '["Plan editorial mensual","Autopublicación en tu CMS","Auditoría técnica","Seguimiento en 3 modelos de IA","Soporte por email"]', 1),
  ('cosecha', 'Cosecha', 29900, 14900, 80, 40, 4, null, 'daily', 60,
   '["Todo lo de Semilla","4 idiomas","Agentes de Reddit y Quora","Editora de contenidos asignada","Soporte prioritario"]', 2),
  ('agencia', 'Agencia', 0, 0, 0, 0, 0, null, 'daily', 0,
   '["Marca blanca","Portal para tus clientes","Precio por volumen"]', 3)
on conflict (id) do nothing;
