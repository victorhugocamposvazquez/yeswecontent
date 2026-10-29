#!/usr/bin/env bash
# Solo la migración de coste IA. Uso: bash scripts/apply-migration-0011.sh
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env.local; set +a
PSQL=""
for c in psql /usr/local/opt/libpq/bin/psql /opt/homebrew/opt/libpq/bin/psql; do
  if command -v "$c" >/dev/null 2>&1 || [[ -x "$c" ]]; then PSQL=$c; break; fi
done
[[ -n "$PSQL" ]] || { echo "Falta psql"; exit 1; }
"$PSQL" "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0011_ai_usage.sql
echo "OK: ai_usage_events"
