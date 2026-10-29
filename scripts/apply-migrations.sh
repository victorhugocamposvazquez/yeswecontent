#!/usr/bin/env bash
# Aplica migraciones usando DATABASE_URL de .env.local
# Uso: bash scripts/apply-migrations.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "Falta .env.local. Ejecuta antes: bash scripts/setup-devteam-env.sh" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL vacío en .env.local" >&2
  exit 1
fi

PSQL=""
for c in psql /usr/local/opt/libpq/bin/psql /opt/homebrew/opt/libpq/bin/psql; do
  if command -v "$c" >/dev/null 2>&1 || [[ -x "$c" ]]; then
    PSQL=$c
    break
  fi
done
if [[ -z "$PSQL" ]]; then
  echo "No hay psql. Instala: brew install libpq && brew link --force libpq" >&2
  exit 1
fi

echo "Usando: $PSQL"
echo "Probando conexión…"
"$PSQL" "$DATABASE_URL" -c 'select current_database() as db, current_user as user;'

MIGS=(
  supabase/migrations/0001_init.sql
  supabase/migrations/0002_app_settings.sql
  supabase/migrations/0003_client_portal.sql
  supabase/migrations/0004_specialist.sql
  supabase/migrations/0005_integrations.sql
  supabase/migrations/0006_engine.sql
  supabase/migrations/0007_headless.sql
  supabase/migrations/0008_plan_annual_discount_15.sql
  supabase/migrations/0009_hosted_blog_delivery.sql
  supabase/migrations/0010_hosted_blog_slug.sql
  supabase/migrations/0011_ai_usage.sql
  supabase/seed.sql
)
for f in "${MIGS[@]}"; do
  echo "→ $f"
  "$PSQL" "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo
echo "OK. Tablas en public:"
"$PSQL" "$DATABASE_URL" -c '\dt public.*'
