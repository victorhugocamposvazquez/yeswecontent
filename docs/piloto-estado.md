# Estado del piloto — auditoría (2026-10-29)

Objetivo: piloto usable con 1–3 webs reales (contenido + publicación).

## 1. Auditoría de producción

| Recurso | Estado | Detalle |
| --- | --- | --- |
| `.env.local` | **OK** | Conectado a `lhaycvxtsjjknfapehsw` (pooler `eu-west-1`). |
| Proyecto Vercel | **OK** | `dev-team-0e4cbb6f/yeswecontent` (`prj_OMJhFNw78UP3mfvFqyOhFsou8fqq`). |
| Proyecto Supabase | **OK** | `https://lhaycvxtsjjknfapehsw.supabase.co` |
| Migraciones | **OK** | `0001`–`0010` + seed aplicados (32 tablas en `public`). |
| Env Vercel (prod/dev) | Parcial | URL Supabase, anon, service_role, CRON/OAUTH/ENC, SITE_URL. Falta `ANTHROPIC_API_KEY` (y Stripe/Resend si cobras). |

### Env mínima cuando exista el deploy

Ver [`.env.example`](../.env.example). Imprescindibles para piloto real:

- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`, `CRON_SECRET`
- `INTEGRATIONS_ENCRYPTION_KEY`, `OAUTH_STATE_SECRET` (si CMS/OAuth)
- Stripe + Resend si hay cobro o emails de facturación

### Crons reales (`vercel.json`)

Todos **1×/día** (UTC): analytics 04:00, visibility 05:00, publish 06:00, social 07:00. No hay cron de **redacción**.

## 2. Checklist smoke (primer sitio)

Hacerlo **después** de: proyecto Supabase + `db push` + seed, deploy Vercel con env, Auth URLs y un usuario `role = admin`.

1. Registro en `/registro` → email confirmado → entra a `/onboarding`.
2. Completar onboarding (web, voz, plan). Con Stripe: Checkout; sin Stripe: trial en DB.
3. En `/panel/plan`: **Generar plan del mes que viene**.
4. En un tema: **Escribir ya** (requiere `ANTHROPIC_API_KEY`).
5. Revisar artículo en `/panel/articulos` → programar fecha de publicación.
6. Entrega:
   - **CMS** conectado en Integraciones, **o**
   - **Blog alojado** y abrir `/b/{slug}` (o host `*.blogs…` si DNS/wildcard listos).
7. Forzar o esperar cron: `GET /api/cron/publish` con `Authorization: Bearer $CRON_SECRET`.
8. Comprobar URL pública del artículo y logs de Vercel.

Rutas de código a verificar si algo falla:

- Plan / redacción: `src/app/panel/actions.ts` (`generateNextMonthPlan`, `writeNow`)
- Publicación: `src/app/api/cron/publish/route.ts`, `src/lib/publish/`
- Blog alojado: `src/middleware.ts`, `src/app/blog-hosted/`

## 3. Marketing P0 (hecho en código)

Se **retiró** la píldora de valoración provisional del hero (`RatingPill` / cifras inventadas). No lanzar de nuevo cifras de reseñas hasta tener datos verificados.

## 4. Siguiente prioridad (decisión)

**Elegido: cron de redacción automática** (antes que pulir Stripe).

Motivos:

1. Infra de cobro aún no existe; el valor del piloto es **contenido publicado**, no el checkout.
2. Hoy el “piloto automático” exige pulsar «Escribir ya» por tema; es el mayor hueco vs la promesa del producto.
3. Stripe se cablea en paralelo cuando haya el primer cobro (productos + webhook + IDs en `/admin/planes`).

Siguiente implementación de producto sugerida: endpoint `/api/cron/generate` (o ampliar publish) que tome temas `planned` del día y llame a la misma lógica que `writeNow`, con límite por plan y `CRON_SECRET`.

## 5. Acciones ops pendientes (manuales)

1. Crear proyecto Supabase «yeswecontent» → `supabase link` → `db push` → `seed.sql`.
2. Importar el repo en Vercel (cuenta correcta) → variables de Production/Preview.
3. Auth Supabase: Site URL + redirects; promover admin.
4. (Opcional piloto de pago) Stripe + Resend.
5. Ejecutar el smoke de la sección 2.
