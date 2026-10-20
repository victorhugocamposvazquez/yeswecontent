# yeswecontent: mapa de funcionalidades (a partir del análisis de babylovegrowth.ai)

Fuente: análisis con el MCP rea del bundle Next.js público (rutas del router) y del árbol de accesibilidad de la home y de /pricing, el 20/10/2026. Sin cuentas, sin pagos y sin entrar en zonas protegidas: los paneles se deducen de las rutas declaradas en el JavaScript público, no se han visto por dentro.

## 1. Qué es el producto
Plataforma SaaS de SEO + GEO/AEO (posicionamiento en Google y en respuestas de IA) en piloto automático: genera un plan de contenidos, escribe artículos con la voz de la marca, los publica en el CMS del cliente, consigue backlinks mediante una red de intercambio, mide la visibilidad en ChatGPT/Claude/Gemini/Perplexity y reparte contenido en redes (Reddit, Quora, carruseles de Instagram/Facebook). Tiene modo agencia/marca blanca.

## 2. Web pública
- Home: pasos de funcionamiento, bloques por funcionalidad (artículos con tu voz, estrategia, autopublicación, backlinks, auditoría técnica, social, visibilidad en IA, 50+ idiomas), casos de éxito, CTA de prueba.
- Precios (/pricing): planes, comparativa detallada, descuentos por volumen, bloque agencias, FAQ.
- Páginas de producto/SEO: agente SEO IA, redactor de blog IA, autoblog, enlazado interno automático, backlinks / intercambio de backlinks, visibilidad IA, GEO, AEO, posicionar en ChatGPT / LLMs, Shopify, marca blanca, auditoría del sitio.
- ~45 herramientas gratuitas (/free-tools/*): auditorías IA/GEO, verificadores (robots.txt, sitemap, H1, meta description, canonical, Open Graph, índice de Google, densidad de palabras clave), generadores (llms.txt, robots.txt, schema JSON-LD), vista previa SERP, análisis de competidores. Son captadores de leads.
- Casos de éxito (listado + ~20 fichas), blog, docs, academias (SEO/AEO, Shopify, SEO local), afiliados, comparativas, legal (privacidad, términos).
- Auth: sign-in, sign-up, reset/change password. Multi-idioma (/es, etc.).

## 3. Onboarding (usuario nuevo)
select-website → business-details → select-language → brand-voice → select-competitors → seo-settings → connect-gsc (Google Search Console) → select-plan → acquisition-survey. Rama agencia: agency → agency-brand → agency-team → agency-dns → agency-call.

## 4. Panel de usuario (/dashboard)
- Resumen (overview) y novedades del producto.
- Plan de contenidos (calendario de temas) + mejoras de artículos existentes.
- Artículos (listado, editor, puntuación de calidad 0–100, estado de publicación).
- Visibilidad IA (prompts rastreados por modelo, citas).
- Auditoría GEO/técnica (con enlace público compartible /geo-audit/share).
- Intercambio de backlinks.
- Reddit / Quora (agentes que proponen respuestas), Socials (carruseles IG/FB).
- Analítica: tráfico Google (GSC), tráfico IA, GA4. Informes (reporting) y "especialista SEO".
- Ajustes: cuenta, negocio, equipo, estilo de escritura, calendario de publicación, mejoras, formato de artículo, estilo visual de imágenes, branding, marca blanca, publicación (integraciones CMS), analítica, competidores, facturación, catálogo de productos (Shopify), Meta, Reddit, Quora, referidos.

## 5. Portal de clientes de agencia (/clients)
Facturas, ajustes de branding, hosting/DNS, miembros, perfil, contacto con el equipo.

## 6. Panel de administración
Rutas /blg-admin y /dashboard/admin (internas, no observables). Funciones inferidas que replicaremos: usuarios y workspaces, suscripciones y planes, cola de generación/publicación de artículos, red de backlinks (moderación de sitios), herramientas gratuitas y leads, casos de éxito/blog (CMS), métricas de negocio (MRR, altas, churn), suplantar usuario para soporte.

## 7. Modelo de precios observado
- Suscripción por sitio web. Plan básico 49 €/mes y plan superior 199 €/mes con pago anual (ahorro anunciado del 50% frente a mensual).
- Prueba gratuita de 3 días y garantía de devolución de 90 días.
- Diferencias entre planes: artículos/mes (30 vs 120), prompts IA rastreados (10 vs 50), valor de backlinks, frecuencia de posts sociales (semanal vs diaria), idiomas, usuarios (1 vs ilimitados), especialista dedicado, soporte prioritario.
- Descuentos por volumen de sitios: 2–4 (10%), 5–8 (12%), 9–14 (15%), 15+ (20% / contacto).
- Programa de agencias/reventa con marca blanca y llamada comercial.

## 8. Propuesta para yeswecontent
Funcionalidades y arquitectura equivalentes; marca, textos, ilustraciones y estilo visual 100% propios (nada copiado). Planes con nombres y cifras propias, editables desde el admin.

**Stack (fijado por Hugo):** Next.js (App Router, TypeScript) en Vercel + Supabase (Auth, Postgres con RLS, Storage). Extras: Tailwind CSS con componentes propios, Stripe (suscripciones, prueba, descuentos por volumen), API de Claude para estrategia/artículos/visibilidad IA, Vercel Cron para calendario de publicación y rastreo diario, Resend para emails, next-intl para ES/EN.

**Orden de construcción:**
1. Base: proyecto, diseño propio, esquema de base de datos y auth.
2. Web corporativa: home, precios, producto, casos, herramientas gratuitas (empezando por 4–5 reales), legal.
3. Onboarding + panel de usuario (plan, artículos, publicación, visibilidad IA, auditoría, analítica, ajustes).
4. Panel de administración.
5. Integraciones reales (Stripe, Claude, CMS, GSC) detrás de claves; sin claves la app funciona en modo demo.
