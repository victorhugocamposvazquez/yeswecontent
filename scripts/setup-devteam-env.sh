#!/usr/bin/env bash
# Configura env en Vercel (DEV TEAM) y aplica migraciones Supabase.
# Uso: bash scripts/setup-devteam-env.sh
# Solo production + development (preview se puede añadir luego en el dashboard).
set -euo pipefail
cd "$(dirname "$0")/.."
SCOPE=dev-team-0e4cbb6f
REF=lhaycvxtsjjknfapehsw
URL="https://${REF}.supabase.co"
TARGETS=(production development)

echo "==> Proyecto Vercel: $SCOPE/yeswecontent"
# Evita que `vercel link` pise .env.local a mitad de proceso
vercel link --yes --project yeswecontent --scope "$SCOPE" >/dev/null

CRON=$(openssl rand -base64 32)
OAUTH=$(openssl rand -base64 32)
ENC=$(openssl rand -base64 32)

add() {
  local key="$1" val="$2" env="$3"
  if [[ "$env" != "development" && "$key" != NEXT_PUBLIC_* ]]; then
    vercel env add "$key" "$env" --value "$val" --yes --scope "$SCOPE" --force --sensitive >/dev/null
  else
    vercel env add "$key" "$env" --value "$val" --yes --scope "$SCOPE" --force >/dev/null
  fi
  echo "  ✓ $key ($env)"
}

echo "==> Variables generadas / URL"
for env in "${TARGETS[@]}"; do
  add NEXT_PUBLIC_SUPABASE_URL "$URL" "$env"
  add CRON_SECRET "$CRON" "$env"
  add OAUTH_STATE_SECRET "$OAUTH" "$env"
  add INTEGRATIONS_ENCRYPTION_KEY "$ENC" "$env"
  add NEXT_PUBLIC_SITE_URL "http://localhost:3000" "$env"
done

echo
echo "==> Claves Supabase (Settings → API)"
read -r -s -p "anon key: " ANON; echo
read -r -s -p "service_role key: " SERVICE; echo
read -r -s -p "Database password: " DBPASS; echo

if [[ -z "$ANON" || -z "$SERVICE" || -z "$DBPASS" ]]; then
  echo "Faltan anon, service_role o password." >&2
  exit 1
fi

for env in "${TARGETS[@]}"; do
  add NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON" "$env"
  add SUPABASE_SERVICE_ROLE_KEY "$SERVICE" "$env"
done

DBPASS_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DBPASS")
DIRECT="postgresql://postgres:${DBPASS_ENC}@db.${REF}.supabase.co:5432/postgres?sslmode=require"

echo "==> .env.local"
umask 077
cat > .env.local <<EOF
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=$URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON
SUPABASE_SERVICE_ROLE_KEY=$SERVICE
CRON_SECRET=$CRON
OAUTH_STATE_SECRET=$OAUTH
INTEGRATIONS_ENCRYPTION_KEY=$ENC
DATABASE_URL=$DIRECT
EOF

echo "==> Migraciones (db.${REF}.supabase.co)"
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
  supabase/seed.sql
)
PSQL_BIN=""
for c in psql /usr/local/opt/libpq/bin/psql /opt/homebrew/opt/libpq/bin/psql; do
  if command -v "$c" >/dev/null 2>&1 || [[ -x "$c" ]]; then
    PSQL_BIN=$c
    break
  fi
done
run_sql() {
  local f="$1"
  if [[ -n "$PSQL_BIN" ]]; then
    "$PSQL_BIN" "$DIRECT" -v ON_ERROR_STOP=1 -f "$f"
  elif command -v docker >/dev/null; then
    docker run --rm -i postgres:16-alpine psql "$DIRECT" -v ON_ERROR_STOP=1 < "$f"
  else
    echo "Instala psql: brew install libpq && brew link --force libpq" >&2
    echo "Luego: bash scripts/apply-migrations.sh" >&2
    return 1
  fi
}
for f in "${MIGS[@]}"; do
  echo "  → $f"
  run_sql "$f"
done

echo
echo "Listo (production + development)."
echo "Revisa: vercel env ls --scope $SCOPE"
echo "Luego: npm run dev  (o vercel --prod)"
