import "server-only";

import { promises as dns } from "node:dns";
import { hostedBlogCnameTarget } from "@/lib/headless/hosted-blog";
import { normalizeHost } from "@/lib/headless/hosts";

/** Comprueba que el subdominio del cliente apunta al CNAME de la plataforma. */
export async function verifyHostedBlogDns(hostname: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const host = normalizeHost(hostname);
  const target = normalizeHost(hostedBlogCnameTarget());
  if (!host || !target) return { ok: false, message: "Indica un subdominio válido." };

  try {
    const chain: string[] = [host];
    for (let i = 0; i < 8; i++) {
      const name = chain[chain.length - 1]!;
      let cnames: string[];
      try {
        cnames = await dns.resolveCname(name);
      } catch {
        break;
      }
      for (const c of cnames) {
        const n = normalizeHost(c.replace(/\.$/, ""));
        if (n === target || n.endsWith(`.${target}`)) return { ok: true };
        chain.push(n);
      }
    }
  } catch {
    /* fallthrough */
  }

  return {
    ok: false,
    message: `Crea un registro CNAME: ${host} → ${target}. La propagación puede tardar hasta 24 h (suele ser minutos).`,
  };
}
