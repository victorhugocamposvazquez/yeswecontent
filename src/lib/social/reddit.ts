/**
 * Reddit: respuesta (comentario) en un hilo o a un comentario concreto.
 */
import "server-only";
import { readJson, redditUserAgent } from "@/lib/oauth/providers";

/** URL de Reddit → fullname del elemento al que respondemos (t3_ = post, t1_ = comentario). */
export function redditThingId(threadUrl: string): string | null {
  try {
    const u = new URL(threadUrl);
    if (!/(^|\.)reddit\.com$|^redd\.it$/.test(u.hostname)) return null;
    if (u.hostname === "redd.it") return `t3_${u.pathname.replace(/\//g, "")}`;
    const m = u.pathname.match(/\/comments\/([a-z0-9]+)(?:\/[^/]*\/([a-z0-9]+))?/i);
    if (!m) return null;
    return m[2] ? `t1_${m[2]}` : `t3_${m[1]}`;
  } catch {
    return null;
  }
}

export async function postRedditComment(token: string, threadUrl: string, text: string): Promise<{ id: string; url: string | null }> {
  const thing = redditThingId(threadUrl);
  if (!thing) throw new Error("La URL de la conversación de Reddit no es válida.");
  const r = await readJson<{ json?: { errors?: [string, string, string][]; data?: { things?: { data: { name: string; permalink?: string } }[] } } }>(
    await fetch("https://oauth.reddit.com/api/comment", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "user-agent": redditUserAgent(), "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ api_type: "json", thing_id: thing, text }),
      cache: "no-store",
    }),
    "Reddit",
  );
  const errors = r.json?.errors ?? [];
  if (errors.length) throw new Error(`Reddit: ${errors.map((e) => e[1]).join("; ")}`);
  const c = r.json?.data?.things?.[0]?.data;
  if (!c) throw new Error("Reddit no ha devuelto el comentario publicado.");
  return { id: c.name, url: c.permalink ? `https://www.reddit.com${c.permalink}` : null };
}
