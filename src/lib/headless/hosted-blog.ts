import { siteUrl } from "@/lib/env";
import { normalizeHost } from "@/lib/headless/hosts";

export type HostedBlogDeliveryMode = "platform" | "subdomain" | "folder";

export function hostedBlogCnameTarget() {
  return process.env.HOSTED_BLOG_CNAME_TARGET ?? "blogs.yeswecontent.com";
}

const normSiteUrl = (raw: string) => (/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`).replace(/\/$/, "");

/** Sugerencias a partir de la URL del sitio (p. ej. https://tienda.com → blog.tienda.com). */
export function suggestHostedBlogUrls(siteUrlRaw: string) {
  try {
    const u = new URL(normSiteUrl(siteUrlRaw));
    const root = u.hostname.replace(/^www\./i, "");
    return {
      subdomainHost: `blog.${root}`,
      folderBaseUrl: `${u.origin}/blog`,
    };
  } catch {
    return { subdomainHost: "blog.tudominio.com", folderBaseUrl: "https://tudominio.com/blog" };
  }
}

/** URL pública en la plataforma (sin DNS del cliente). */
export function platformHostedBlogUrl(siteId: string) {
  return `${siteUrl.replace(/\/$/, "")}/blog-hosted/${siteId}`;
}

export function buildHostedBlogRow(input: {
  siteId: string;
  siteName?: string | null;
  siteUrl?: string | null;
  mode: HostedBlogDeliveryMode;
  customDomain?: string | null;
  publicBaseUrl?: string | null;
  enabled?: boolean;
}) {
  const hints = input.siteUrl ? suggestHostedBlogUrls(input.siteUrl) : null;
  const platformUrl = platformHostedBlogUrl(input.siteId);
  let custom_domain: string | null = null;
  let public_base_url: string | null = null;

  if (input.mode === "platform") {
    public_base_url = platformUrl;
  } else if (input.mode === "subdomain") {
    custom_domain = normalizeHost(input.customDomain || hints?.subdomainHost || "") || null;
    public_base_url = custom_domain ? `https://${custom_domain}` : platformUrl;
  } else {
    public_base_url = (input.publicBaseUrl || hints?.folderBaseUrl || platformUrl).replace(/\/$/, "");
  }

  return {
    site_id: input.siteId,
    enabled: input.enabled ?? true,
    delivery_mode: input.mode,
    custom_domain,
    public_base_url,
    title: input.siteName ? `Blog de ${input.siteName}` : null,
    tagline: null as string | null,
    updated_at: new Date().toISOString(),
  };
}
