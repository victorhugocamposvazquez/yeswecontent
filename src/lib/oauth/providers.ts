/**
 * Proveedores OAuth: Google (Search Console + GA4), Meta (Facebook + Instagram) y Reddit.
 * Todo con fetch, sin SDKs. Quora no tiene API pública de publicación: no aparece aquí.
 */
import "server-only";
import { siteUrl } from "@/lib/env";

export type OAuthProviderId = "google" | "meta" | "reddit";

export interface TokenSet {
  access_token: string;
  refresh_token?: string | null;
  /** Epoch ms; null = no caduca (o no lo sabemos). */
  expires_at: number | null;
  scope?: string | null;
}

export interface OAuthAccount {
  id: string;
  name: string;
}

export interface OAuthProvider {
  id: OAuthProviderId;
  label: string;
  authorizeUrl: string;
  scopes: string[];
  scopeSeparator: string;
  pkce: boolean;
  extraParams: Record<string, string>;
  configured: () => boolean;
  exchange: (code: string, verifier: string | null) => Promise<TokenSet>;
  refresh: ((refreshToken: string) => Promise<TokenSet>) | null;
  account: (accessToken: string) => Promise<OAuthAccount>;
  revoke?: (token: string) => Promise<void>;
}

export const META_GRAPH = "https://graph.facebook.com/v21.0";
export const redditUserAgent = () => process.env.REDDIT_USER_AGENT || "web:yeswecontent:1.0 (by /u/yeswecontent)";

export const redirectUri = (provider: OAuthProviderId) => `${siteUrl.replace(/\/$/, "")}/api/oauth/${provider}/callback`;

const expiresAt = (seconds: unknown) => (typeof seconds === "number" && seconds > 0 ? Date.now() + seconds * 1000 : null);

async function json<T>(res: Response, what: string): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* respuesta no JSON */
  }
  if (!res.ok) {
    const b = body as { error_description?: string; error?: string | { message?: string }; message?: string } | null;
    const msg = b?.error_description ?? (typeof b?.error === "object" ? b.error?.message : b?.error) ?? b?.message ?? text.slice(0, 200);
    throw new Error(`${what}: ${msg || res.status}`);
  }
  return body as T;
}

/* ───────── Google ───────── */

const google: OAuthProvider = {
  id: "google",
  label: "Google",
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  scopes: ["openid", "email", "https://www.googleapis.com/auth/webmasters.readonly", "https://www.googleapis.com/auth/analytics.readonly"],
  scopeSeparator: " ",
  pkce: true,
  // offline + consent: Google solo devuelve refresh_token así.
  extraParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
  configured: () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  async exchange(code, verifier) {
    const body = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri("google"),
      grant_type: "authorization_code",
      ...(verifier ? { code_verifier: verifier } : {}),
    });
    const t = await json<{ access_token: string; refresh_token?: string; expires_in?: number; scope?: string }>(
      await fetch("https://oauth2.googleapis.com/token", { method: "POST", body, cache: "no-store" }),
      "Google token",
    );
    return { access_token: t.access_token, refresh_token: t.refresh_token ?? null, expires_at: expiresAt(t.expires_in), scope: t.scope ?? null };
  },
  async refresh(refreshToken) {
    const body = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, refresh_token: refreshToken, grant_type: "refresh_token" });
    const t = await json<{ access_token: string; expires_in?: number; scope?: string }>(
      await fetch("https://oauth2.googleapis.com/token", { method: "POST", body, cache: "no-store" }),
      "Google refresh",
    );
    return { access_token: t.access_token, refresh_token: refreshToken, expires_at: expiresAt(t.expires_in), scope: t.scope ?? null };
  },
  async account(accessToken) {
    const u = await json<{ sub: string; email?: string; name?: string }>(
      await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${accessToken}` }, cache: "no-store" }),
      "Google userinfo",
    );
    return { id: u.sub, name: u.email ?? u.name ?? "Cuenta de Google" };
  },
  async revoke(token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => undefined);
  },
};

/* ───────── Meta (Facebook Login) ───────── */

const meta: OAuthProvider = {
  id: "meta",
  label: "Meta",
  authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
  // pages_read_engagement es requisito de Meta para pages_manage_posts e instagram_content_publish.
  scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish", "business_management"],
  scopeSeparator: ",",
  pkce: false,
  extraParams: { response_type: "code", auth_type: "rerequest" },
  configured: () => !!(process.env.META_APP_ID && process.env.META_APP_SECRET),
  async exchange(code) {
    const short = await json<{ access_token: string; expires_in?: number }>(
      await fetch(
        `${META_GRAPH}/oauth/access_token?${new URLSearchParams({ client_id: process.env.META_APP_ID!, client_secret: process.env.META_APP_SECRET!, redirect_uri: redirectUri("meta"), code })}`,
        { cache: "no-store" },
      ),
      "Meta token",
    );
    // Token de usuario de larga duración (~60 días). Los tokens de página derivados de él no caducan.
    const long = await json<{ access_token: string; expires_in?: number }>(
      await fetch(
        `${META_GRAPH}/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: process.env.META_APP_ID!, client_secret: process.env.META_APP_SECRET!, fb_exchange_token: short.access_token })}`,
        { cache: "no-store" },
      ),
      "Meta token largo",
    );
    return { access_token: long.access_token, refresh_token: null, expires_at: expiresAt(long.expires_in ?? 60 * 86_400) };
  },
  refresh: null,
  async account(accessToken) {
    const u = await json<{ id: string; name?: string }>(await fetch(`${META_GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`, { cache: "no-store" }), "Meta perfil");
    return { id: u.id, name: u.name ?? "Cuenta de Facebook" };
  },
  async revoke(token) {
    await fetch(`${META_GRAPH}/me/permissions?access_token=${encodeURIComponent(token)}`, { method: "DELETE" }).catch(() => undefined);
  },
};

/* ───────── Reddit ───────── */

const redditBasic = () => `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString("base64")}`;

const reddit: OAuthProvider = {
  id: "reddit",
  label: "Reddit",
  authorizeUrl: "https://www.reddit.com/api/v1/authorize",
  scopes: ["identity", "submit", "read"],
  scopeSeparator: " ",
  pkce: false,
  extraParams: { duration: "permanent" },
  configured: () => !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
  async exchange(code) {
    const t = await json<{ access_token: string; refresh_token?: string; expires_in?: number; scope?: string }>(
      await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: { authorization: redditBasic(), "user-agent": redditUserAgent() },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri("reddit") }),
        cache: "no-store",
      }),
      "Reddit token",
    );
    return { access_token: t.access_token, refresh_token: t.refresh_token ?? null, expires_at: expiresAt(t.expires_in), scope: t.scope ?? null };
  },
  async refresh(refreshToken) {
    const t = await json<{ access_token: string; expires_in?: number; scope?: string }>(
      await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: { authorization: redditBasic(), "user-agent": redditUserAgent() },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
        cache: "no-store",
      }),
      "Reddit refresh",
    );
    return { access_token: t.access_token, refresh_token: refreshToken, expires_at: expiresAt(t.expires_in), scope: t.scope ?? null };
  },
  async account(accessToken) {
    const u = await json<{ id: string; name: string }>(
      await fetch("https://oauth.reddit.com/api/v1/me", { headers: { authorization: `Bearer ${accessToken}`, "user-agent": redditUserAgent() }, cache: "no-store" }),
      "Reddit perfil",
    );
    return { id: u.id, name: `u/${u.name}` };
  },
  async revoke(token) {
    await fetch("https://www.reddit.com/api/v1/revoke_token", {
      method: "POST",
      headers: { authorization: redditBasic(), "user-agent": redditUserAgent() },
      body: new URLSearchParams({ token, token_type_hint: "refresh_token" }),
    }).catch(() => undefined);
  },
};

export const PROVIDERS: Record<OAuthProviderId, OAuthProvider> = { google, meta, reddit };
export const OAUTH_PROVIDERS = Object.keys(PROVIDERS) as OAuthProviderId[];

export function getProvider(id: string): OAuthProvider | null {
  return (PROVIDERS as Record<string, OAuthProvider>)[id] ?? null;
}

export function authorizeUrl(p: OAuthProvider, state: string, challenge: string | null): string {
  const clientId = p.id === "google" ? process.env.GOOGLE_CLIENT_ID! : p.id === "meta" ? process.env.META_APP_ID! : process.env.REDDIT_CLIENT_ID!;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(p.id),
    response_type: "code",
    scope: p.scopes.join(p.scopeSeparator),
    state,
    ...p.extraParams,
  });
  if (p.pkce && challenge) {
    params.set("code_challenge", challenge);
    params.set("code_challenge_method", "S256");
  }
  return `${p.authorizeUrl}?${params}`;
}

export { json as readJson };
