# yeswecontent

Piloto automático de contenido **SEO + GEO/AEO** que se vende por web y por suscripción. yeswecontent prepara el plan editorial, escribe artículos con la voz de cada marca, los publica en su CMS, consigue enlaces dentro de una red de intercambio entre clientes y comprueba si ChatGPT, Claude, Gemini y Perplexity recomiendan la marca.

- **Planes:** Semilla y Cosecha, con pago mensual o anual, 3 días de prueba y descuentos por volumen según el número de webs. También hay un plan Agencia con marca blanca.
- **Superficies:** web pública con herramientas gratuitas que captan leads, onboarding, panel de cliente (`/panel`) y panel de administración (`/admin`).

El mapa completo de funcionalidades está en [`docs/mapa-funcionalidades.md`](docs/mapa-funcionalidades.md).

## Stack

| Capa | Tecnología |
| --- | --- |
| App | Next.js 15 (App Router, Server Actions) + TypeScript |
| Estilos | Tailwind CSS v4 con tokens propios (`src/app/globals.css`) y componentes en `src/components/ui` |
| Datos y auth | Supabase (Postgres con RLS, Auth, Storage) |
| IA | API de Claude como modelo principal; OpenAI, Gemini y Perplexity para medir visibilidad |
| Pagos | Stripe (Checkout, Billing Portal, webhooks) |
| Email | Resend |
| Hosting | Vercel, con Vercel Cron para publicar y medir visibilidad |

## Puesta en marcha en local

Requisitos: Node 20 o superior y npm.

```bash
npm install
cp .env.example .env.local   # opcional: sin variables arranca en modo demo
npm run dev
```

Abre http://localhost:3000. Rutas útiles: `/` (web), `/precios`, `/panel`, `/admin`.

### Modo demo

Si faltan `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`, la app entra en **modo demo** (`isDemo` en `src/lib/env.ts`):

- Todas las pantallas usan los datos ficticios de `src/lib/demo.ts` y `src/lib/admin/demo.ts`.
- No se pide login. El usuario demo es admin, así que `/admin` también está accesible.
- Las acciones (guardar, aprobar, cancelar…) responden con un mensaje de confirmación pero **no guardan nada**.
- Sin `STRIPE_SECRET_KEY`, `/api/stripe/checkout` y `/api/stripe/portal` devuelven `{ url: null, demo: true }`.
- Sin `RESEND_API_KEY`, los emails se escriben en la consola en lugar de enviarse.

## Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) y copia la URL, la `anon key` y la `service_role key` en `.env.local`.
2. Aplica el esquema y los datos iniciales con la CLI de Supabase o desde el editor SQL:

   ```bash
   supabase link --project-ref <tu-ref>
   supabase db push                    # aplica supabase/migrations/*
   psql "$DATABASE_URL" -f supabase/seed.sql   # planes iniciales
   ```

   Si usas el editor SQL, ejecuta primero `supabase/migrations/0001_init.sql` y después `supabase/seed.sql`.

3. **Ajustes globales del admin.** El panel de administración guarda los ajustes globales, los descuentos por volumen y los dominios vetados en una tabla clave-valor. Mientras no exista una migración que la cree, ejecuta esto:

   ```sql
   create table if not exists public.app_settings (
     key text primary key,          -- 'global' | 'volume_discounts' | 'banned_domains'
     value jsonb not null,
     updated_at timestamptz not null default now()
   );
   alter table public.app_settings enable row level security;
   create policy "ajustes admin" on public.app_settings for all using (public.is_admin());
   ```

   Si la tabla no existe, el admin muestra los valores por defecto y avisa al intentar guardar.

4. En Authentication → URL Configuration, pon tu dominio como Site URL y añade `http://localhost:3000/**` a las Redirect URLs.

### Dar acceso de administrador a un usuario

Regístrate en la app y luego ejecuta en el editor SQL:

```sql
update public.profiles set role = 'admin' where email = 'tu@email.com';
```

A partir de ahí puedes conceder o quitar el rol desde `/admin/usuarios/<id>`. El acceso a `/admin` se comprueba dos veces: en el middleware y en el layout del admin, en el servidor. Las escrituras del admin usan la service role solo después de verificar que quien llama es admin.

## Variables de entorno

| Variable | Para qué sirve |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública. Se usa en las redirecciones de Stripe y en los enlaces de los emails |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente de Supabase. Si faltan, la app funciona en modo demo |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo en el servidor: webhooks, crons y admin |
| `ANTHROPIC_API_KEY` | Claude: estrategia, artículos y puntuación |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY` | Seguimiento de visibilidad en cada asistente de IA |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Suscripciones y webhook |
| `RESEND_API_KEY` (y `EMAIL_FROM`, opcional) | Emails transaccionales |
| `CRON_SECRET` | Protege `/api/cron/*` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth de Search Console y GA4 |

Encontrarás una plantilla en [`.env.example`](.env.example).

## Stripe

1. **Productos y precios.** Crea un producto por plan (Semilla y Cosecha) con dos precios recurrentes en EUR:
   - mensual: el importe de `monthly_price_eur`;
   - anual: el importe del **año completo**, es decir, `yearly_price_eur × 12`. En la base de datos `yearly_price_eur` guarda el precio por mes.

   Copia los `price_…` en `/admin/planes` (campos «Stripe price ID»). Sin ese ID, el checkout de ese plan devuelve un error explicativo.
2. **Descuentos por volumen.** Se configuran en `/admin/planes`. Al contratar varias webs en un mismo pago (`sites` > 1), el checkout crea o reutiliza un cupón de porcentaje con un id fijo (`ywc-vol-14`, por ejemplo) y lo aplica a la suscripción.
3. **Prueba de 3 días.** Solo se aplica a la primera suscripción de cada espacio de trabajo.
4. **Webhook.** En Developers → Webhooks, apunta a `https://tu-dominio/api/stripe/webhook` con estos eventos:
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`, `invoice.payment_failed`.
   Copia el *signing secret* en `STRIPE_WEBHOOK_SECRET`. En local:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

5. **Billing Portal.** Actívalo en Settings → Billing → Customer portal y permite cancelar y cambiar el método de pago.

Endpoints:

| Ruta | Entrada | Salida |
| --- | --- | --- |
| `POST /api/stripe/checkout` | `{ planId, interval: "month" \| "year", sites?, siteId? }` | `{ url }` o `{ url: null, demo: true }` |
| `POST /api/stripe/portal` | `{ returnPath? }` | `{ url }` o `{ url: null, demo: true }` |
| `POST /api/stripe/webhook` | Evento firmado de Stripe | Sincroniza `public.subscriptions`, con una fila por web |

## Despliegue en Vercel

1. Importa el repositorio en Vercel. El framework se detecta solo.
2. Añade todas las variables de entorno en Production y Preview. `NEXT_PUBLIC_SITE_URL` debe ser el dominio final.
3. **Crons** (definidos en `vercel.json`):
   - `/api/cron/publish`, cada hora: publica los artículos programados.
   - `/api/cron/visibility`, a diario a las 05:00 UTC: consulta los asistentes de IA.

   Vercel envía `Authorization: Bearer $CRON_SECRET` y los endpoints rechazan cualquier otra llamada.
4. Configura el webhook de Stripe con el dominio de producción y verifica el dominio de envío en Resend.

## Estructura del proyecto

```
src/
  app/
    (marketing)/        web pública: home, precios, producto, casos, agencias
    auditoria/[token]/  informe de auditoría público y compartible
    onboarding/         alta guiada de una web
    panel/              panel del cliente
    admin/              panel de administración (layout + páginas + actions.ts)
    api/
      ai/               generación con IA (plan, artículo, puntuación, visibilidad)
      cron/             tareas programadas de Vercel
      stripe/           checkout, portal y webhook
      admin/leads.csv/  exportación de leads (solo admins)
  components/
    ui/                 sistema de componentes compartido
    admin/              tablas, formularios y shell del admin
  lib/
    env.ts              banderas isDemo, hasStripe…
    data.ts             capa de datos del panel (demo o Supabase con RLS)
    admin/              datos, tipos y guard del admin (service role tras verificar el rol)
    stripe.ts           cliente perezoso de Stripe, cupones de volumen y mapeo de estados
    email.ts            plantillas de email con Resend
    supabase/           clientes de servidor, navegador y middleware
supabase/
  migrations/           esquema SQL con RLS
  seed.sql              planes iniciales
docs/                   documentación de producto
```

### Panel de administración

| Ruta | Qué hace |
| --- | --- |
| `/admin` | MRR, suscripciones activas, pruebas, churn, altas, artículos del mes, gráfico de MRR, mezcla de planes y fallos |
| `/admin/usuarios`, `/admin/usuarios/[id]` | Búsqueda y filtros. En la ficha: espacio de trabajo, webs, suscripciones, uso frente al plan, cambio de rol, ampliar prueba, cancelar y suplantar (stub) |
| `/admin/sitios` | Todas las webs con su plan, artículos, última publicación y salud de las integraciones |
| `/admin/suscripciones` | Tabla con filtros y enlaces a Stripe |
| `/admin/planes` | Edición de precios, límites, características, estado activo e IDs de Stripe, además de los tramos de descuento |
| `/admin/cola` | Cola de generación y publicación por etapas: reintentar y cancelar |
| `/admin/enlaces` | Moderación de la red de enlaces: aprobar, rechazar, filtrar por DR y vetar dominios |
| `/admin/leads` | Leads de las herramientas gratuitas con exportación a CSV |
| `/admin/casos`, `/admin/novedades` | CMS de casos de éxito y novedades de producto, con cuerpo en Markdown |
| `/admin/ajustes` | Modelo de IA por defecto, interruptor de generación y aviso de mantenimiento |

> **Suplantación de usuarios.** Por ahora es un stub: guarda una cookie `ywc_impersonate` durante una hora. Antes de usarla en producción hay que registrar cada sesión en una tabla de auditoría (admin, usuario, motivo, IP, inicio y fin) y hacer que la capa de datos del panel la respete solo para admins verificados.
