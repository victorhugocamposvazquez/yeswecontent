/** Sin Supabase configurado la app arranca en modo demo con datos de ejemplo. */
export const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const hasClaude = !!process.env.ANTHROPIC_API_KEY;
export const hasStripe = !!process.env.STRIPE_SECRET_KEY;
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
