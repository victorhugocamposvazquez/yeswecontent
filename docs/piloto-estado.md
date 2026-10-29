# Estado del piloto — auditoría (2026-10-29)

Objetivo: piloto usable con 1–3 webs reales (contenido + publicación) **antes** de enchufar Anthropic/Stripe/Resend/OAuth de producción.

## 1. Auditoría de producción

| Recurso | Estado | Detalle |
| --- | --- | --- |
| `.env.local` | **OK** | Conectado a `lhaycvxtsjjknfapehsw` (pooler `eu-west-1`). |
| Proyecto Vercel | **OK** | `dev-team-0e4cbb6f/yeswecontent` (`prj_OMJhFNw78UP3mfvFqyOhFsou8fqq`). |
| Proyecto Supabase | **OK** | `https://lhaycvxtsjjknfapehsw.supabase.co` |
| Migraciones | Aplicar | `0001`–`0012` + seed. Incluye `0011` (ai_usage) y `0012` (invitations). |
| Env Vercel (prod/dev) | Parcial | URL Supabase, anon, service_role, CRON/OAUTH/ENC, SITE_URL. Falta `ANTHROPIC_API_KEY` (y Stripe/Resend si cobras). |

### Env mínima cuando exista el deploy

Ver [`.env.example`](../.env.example). Imprescindibles para piloto real:

- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`, `CRON_SECRET`
- `INTEGRATIONS_ENCRYPTION_KEY`, `OAUTH_STATE_SECRET` (si CMS/OAuth)
- Stripe + Resend si hay cobro o emails de facturación

### Crons reales (`vercel.json`)

Todos **1×/día** (UTC):

| Hora | Ruta | Qué hace |
| --- | --- | --- |
| 04:00 | `/api/cron/analytics` | Search Console / GA4 |
| 05:00 | `/api/cron/visibility` | Mentions en asistentes IA |
| 05:30 | `/api/cron/generate` | Redacta temas `planned` (cupo del plan) |
| 06:00 | `/api/cron/publish` | Publica programados |
| 07:00 | `/api/cron/social` | Redes |

## 2. Checklist smoke (primer sitio)

Hacerlo **después** de: proyecto Supabase + migraciones `0001`–`0012` + seed, deploy Vercel con env, Auth URLs y un usuario `role = admin`.

1. Registro en `/registro` → email confirmado → entra a `/onboarding`.
2. Completar onboarding (web, voz, plan). Con Stripe: Checkout; sin Stripe: trial en DB.
3. En `/panel/plan`: **Generar plan del mes que viene** (respeta cupo `articles_per_month`).
4. En un tema: **Escribir ya** (con Claude si hay clave; sin ella, plantilla + banner honesto).
5. Revisar artículo en `/panel/articulos` → programar fecha de publicación.
6. Entrega:
   - **CMS** conectado en Integraciones, **o**
   - **Blog alojado** y abrir `/b/{slug}` (o host `*.blogs…` si DNS/wildcard listos).
7. Forzar o esperar crons: `GET /api/cron/generate` y `GET /api/cron/publish` con `Authorization: Bearer $CRON_SECRET`.
8. Comprobar URL pública del artículo y logs de Vercel.

Rutas de código a verificar si algo falla:

- Plan / redacción: `src/app/panel/actions.ts`, `src/lib/panel/write-content.ts`, `src/lib/panel/quotas.ts`
- Cron redacción: `src/app/api/cron/generate/route.ts`
- Publicación: `src/app/api/cron/publish/route.ts`, `src/lib/publish/`
- Blog alojado: `src/middleware.ts`, `src/app/blog-hosted/`

Higiene local: `npm run typecheck` · `npm run smoke:paths`.

## 3. Checklist pre-API (hecho en código)

- [x] `writeNow` no deja temas en `writing` forever (try/catch → `planned`)
- [x] Cuota del plan en generar plan / escribir / cron generate
- [x] Cron `/api/cron/generate` + entrada en `vercel.json`
- [x] Banner panel sin Claude; mensajes `source=demo` honestos
- [x] Invitaciones → tabla `invitations` (pending; email cuando Resend)
- [x] Facturación: suscripción real; facturas vacías sin mentir; portal solo con Stripe
- [x] Suplantación admin deshabilitada en UI
- [x] Nav «Clientes» solo si `workspace.kind === "agency"`
- [x] Banners si faltan `INTEGRATIONS_ENCRYPTION_KEY` / `OAUTH_STATE_SECRET`

## 4. Marketing P0 (hecho en código)

Se **retiró** la píldora de valoración provisional del hero (`RatingPill` / cifras inventadas). No lanzar de nuevo cifras de reseñas hasta tener datos verificados.

## 5. Siguiente prioridad (APIs)

Tras el dogfood con Reformas + yeswecontent:

1. `ANTHROPIC_API_KEY` en Vercel
2. Stripe (checkout, portal, webhook, facturas)
3. Resend (invitaciones y emails)
4. OAuth Google / Meta / Reddit en producción

## 6. Acciones ops pendientes (manuales)

1. Aplicar migraciones `0011` y `0012` si aún no están en el proyecto Supabase.
2. Auth Supabase: Site URL + redirects; promover admin.
3. (Opcional piloto de pago) Stripe + Resend.
4. Ejecutar el smoke de la sección 2.
