#!/usr/bin/env node
/**
 * Comprueba que existen las piezas del flujo smoke (sin llamar a APIs ni DB).
 * Uso: node scripts/verify-smoke-paths.mjs
 */
import { access } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const required = [
  "src/app/(marketing)/page.tsx",
  "src/app/onboarding/wizard.tsx",
  "src/app/panel/plan/page.tsx",
  "src/app/panel/actions.ts",
  "src/app/api/cron/publish/route.ts",
  "src/app/api/cron/generate/route.ts",
  "src/lib/panel/write-content.ts",
  "src/lib/panel/quotas.ts",
  "src/app/blog-hosted/[siteId]/page.tsx",
  "src/middleware.ts",
  "supabase/migrations/0001_init.sql",
  "supabase/migrations/0010_hosted_blog_slug.sql",
  "supabase/migrations/0011_ai_usage.sql",
  "supabase/migrations/0012_invitations.sql",
  "supabase/seed.sql",
  "vercel.json",
  "docs/piloto-estado.md",
];

const missing = [];
for (const rel of required) {
  try {
    await access(join(root, rel));
  } catch {
    missing.push(rel);
  }
}

if (missing.length) {
  console.error("Faltan rutas del smoke:\n" + missing.map((m) => `  - ${m}`).join("\n"));
  process.exit(1);
}

console.log(`OK: ${required.length} rutas del flujo smoke presentes.`);
console.log("Siguiente: configurar Supabase + Vercel y seguir docs/piloto-estado.md §2.");
