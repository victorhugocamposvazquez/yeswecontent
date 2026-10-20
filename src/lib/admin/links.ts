/** Enlace al dashboard de Stripe (añade /test con claves de prueba). Solo servidor. */
export const stripeDashboardUrl = (kind: "customers" | "subscriptions", id: string) =>
  `https://dashboard.stripe.com${process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") ? "/test" : ""}/${kind}/${id}`;
