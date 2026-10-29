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

   Si usas el editor SQL, ejecuta las migraciones `0001`–`0010` en orden y después `supabase/seed.sql`.

3. **Ajustes globales del admin.** La tabla `app_settings` (ajustes globales, descuentos por volumen y dominios vetados) se crea en `supabase/migrations/0002_app_settings.sql`. Si la tabla no existe, el admin muestra valores por defecto y avisa al intentar guardar.

4. En Authentication → URL Configuration, pon tu dominio como Site URL y añade `http://localhost:3000/**` a las Redirect URLs.

Estado actual del piloto y checklist smoke: [`docs/piloto-estado.md`](docs/piloto-estado.md).

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
| `META_APP_ID`, `META_APP_SECRET` | OAuth de Facebook e Instagram (publicar en la página y carruseles) |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` | OAuth de Reddit (responder en hilos) |
| `OAUTH_STATE_SECRET` | Firma (HMAC) del parámetro `state` de OAuth y de las URLs de las diapositivas |
| `INTEGRATIONS_ENCRYPTION_KEY` | Cifra con AES-256-GCM los tokens OAuth y las credenciales de los CMS en `integrations.config` |

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

## Conexiones OAuth (Google, Meta, Reddit)

Analítica y redes sociales se conectan con OAuth desde **Ajustes › Analítica**, **Ajustes › Redes sociales** y el paso «Conexiones» del onboarding. En modo demo los botones simulan la conexión.

**Cómo funciona.** `GET /api/oauth/{provider}/start?site=<site_id>&return=<ruta>` comprueba que tienes acceso al sitio, firma un `state` con HMAC (`OAUTH_STATE_SECRET`) que lleva el sitio, la ruta de vuelta y tu usuario, y guarda un nonce en una cookie httpOnly de 10 minutos. Con Google añade PKCE (S256). El callback `/api/oauth/{provider}/callback` valida el state, la cookie y la sesión, canjea el código y guarda los tokens **cifrados** (AES-256-GCM con `INTEGRATIONS_ENCRYPTION_KEY`) en `integrations.config`, con este formato: `{ v: 1, secret: "v1.…", account, meta }`. Los tokens se renuevan solos cuando les quedan menos de 2 minutos (`getAccessToken` en `src/lib/oauth/tokens.ts`). Las credenciales de los CMS usan el mismo cifrado.

1. Genera los dos secretos:

   ```bash
   openssl rand -base64 32   # INTEGRATIONS_ENCRYPTION_KEY (no la cambies después: no podrías descifrar los tokens)
   openssl rand -base64 32   # OAUTH_STATE_SECRET
   ```

2. Aplica `supabase/migrations/0005_integrations.sql`. Crea `analytics_daily`, `analytics_snapshots`, las columnas de publicación de `social_posts` y el bucket público `social` de Storage (de ahí descarga Instagram las imágenes de los carruseles).

URIs de redirección exactas (cámbialas por tu dominio en producción; han de coincidir con `NEXT_PUBLIC_SITE_URL`):

| Proveedor | Redirect URI |
| --- | --- |
| Google | `https://tu-dominio/api/oauth/google/callback` y `http://localhost:3000/api/oauth/google/callback` |
| Meta | `https://tu-dominio/api/oauth/meta/callback` |
| Reddit | `https://tu-dominio/api/oauth/reddit/callback` (Reddit admite una sola URI por app: crea otra para local) |

### Google Cloud (Search Console y GA4)

1. En [console.cloud.google.com](https://console.cloud.google.com) crea un proyecto y activa estas APIs: **Google Search Console API**, **Google Analytics Data API** y **Google Analytics Admin API**.
2. En *APIs y servicios › Pantalla de consentimiento de OAuth* elige el tipo «Externo» y añade los scopes `openid`, `email`, `https://www.googleapis.com/auth/webmasters.readonly` y `https://www.googleapis.com/auth/analytics.readonly`. Mientras esté en modo «Prueba», añade a mano los emails que vayan a conectar (100 como máximo; los refresh tokens caducan a los 7 días).
3. En *Credenciales › Crear credenciales › ID de cliente de OAuth* elige «Aplicación web», añade las Redirect URIs de la tabla y copia el ID y el secreto en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
4. Para producción, publica la app y pide la verificación de Google. Los dos scopes son «sensibles», no «restringidos»: hace falta verificar el dominio, una política de privacidad pública y un vídeo que enseñe el flujo. No exigen auditoría de seguridad.

Al conectar, si alguna propiedad de Search Console encaja con la web del sitio, se elige sola y se importan 90 días de datos. Si no, el usuario la elige (junto con la de GA4) en Ajustes › Analítica. Las visitas desde IA son sesiones de GA4 cuyo `sessionSource` contiene `chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `gemini.google.com`, `claude.ai` o `copilot.microsoft.com`.

### Meta (Facebook e Instagram)

1. En [developers.facebook.com](https://developers.facebook.com/apps) crea una app de tipo **Empresa** y añade el producto **Inicio de sesión con Facebook para empresas** (o *Facebook Login*).
2. En *Configuración* del login, añade la Redirect URI en «URI de redireccionamiento de OAuth válidos» y deja activados «Inicio de sesión de OAuth web» y «Modo estricto para URI de redireccionamiento».
3. Copia el *App ID* y la *App Secret* (Configuración › Básica) en `META_APP_ID` y `META_APP_SECRET`. Rellena allí también la URL de la política de privacidad, la de eliminación de datos y el icono.
4. Permisos que pedimos: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish` y `business_management`, este último para ver páginas gestionadas desde un Business Manager.
5. **Revisión de la app.** En modo desarrollo solo funciona con usuarios que tengan un rol en la app. Para clientes reales hace falta:
   - verificar la empresa (Business Verification);
   - pedir **acceso avanzado** a cada permiso en *Revisión de la app*, con un screencast por permiso (conectar, elegir página, publicar un carrusel) e instrucciones de prueba;
   - poner la app en modo «Activo».

   Cuenta con varios días o semanas.
6. Requisitos del usuario: una **página de Facebook** que gestione y, para Instagram, una **cuenta profesional** (Empresa o Creador) vinculada a esa página. Instagram acepta hasta 50 publicaciones por API cada 24 horas por cuenta.

El token de usuario se canjea por uno de larga duración (unos 60 días). Al elegir la página guardamos su token de página, que no caduca mientras el usuario no cambie su contraseña ni retire los permisos. Instagram descarga cada diapositiva por URL: las renderizamos con `next/og` (`/api/social/slide`, firmadas), las convertimos a JPEG y las subimos al bucket público `social`.

### Reddit

1. En [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) pulsa «create another app…», elige el tipo **web app** y pon la Redirect URI de la tabla.
2. Copia el ID (debajo del nombre de la app) y el secreto en `REDDIT_CLIENT_ID` y `REDDIT_CLIENT_SECRET`.
3. Define `REDDIT_USER_AGENT` con el formato que pide Reddit: `web:yeswecontent:1.0 (by /u/tu_usuario)`.
4. Scopes: `identity`, `submit` y `read`, con `duration=permanent` para recibir el refresh token. Para uso comercial o volumen alto, Reddit exige aceptar sus [Data API Terms](https://redditinc.com/policies/data-api-terms) y puede pedir que solicites acceso a la API comercial.

Cada respuesta aprobada en Social › Reddit se publica como comentario en el hilo (o como respuesta al comentario, si la URL lo apunta) desde la cuenta conectada.

### Quora

Quora no tiene API pública para publicar. Las sugerencias se quedan en Social › Quora con el botón «Copiar y abrir en Quora»: copia el texto, abre la pregunta y el usuario la marca como publicada.

### Ajustes en otros módulos

- Los CMS se leen con `loadIntegrationConfig(row)` (`src/lib/oauth/tokens.ts`), que descifra y sigue aceptando las filas antiguas en JSON plano.

## Despliegue en Vercel

1. Importa el repositorio en Vercel. El framework se detecta solo.
2. Añade todas las variables de entorno en Production y Preview. `NEXT_PUBLIC_SITE_URL` debe ser el dominio final.
3. **Crons** (definidos en `vercel.json`; todos **1×/día** en UTC):
   - `/api/cron/analytics` — 04:00: sincroniza Search Console y GA4 en `analytics_daily`.
   - `/api/cron/visibility` — 05:00: consulta los asistentes de IA.
   - `/api/cron/publish` — 06:00: publica los artículos programados.
   - `/api/cron/social` — 07:00: publica en Instagram, Facebook y Reddit lo programado.

   No hay cron de **redacción**: los artículos se generan con «Escribir ya» en el panel (prioridad siguiente del piloto: automatizarlo). Vercel envía `Authorization: Bearer $CRON_SECRET` y los endpoints rechazan cualquier otra llamada.
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
