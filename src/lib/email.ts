/**
 * Emails transaccionales con Resend. Sin RESEND_API_KEY no se envía nada
 * (se registra en consola) para que el modo demo y el desarrollo local funcionen.
 */
import "server-only";
import { Resend } from "resend";
import { siteUrl } from "@/lib/env";

const FROM = process.env.EMAIL_FROM ?? "yeswecontent <hola@yeswecontent.com>";
let client: Resend | null = null;

type SendResult = { sent: boolean; id?: string; error?: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plantilla base: papel cálido, tinta y botón naranja, como la marca. */
function layout({ preheader, title, body, cta }: { preheader: string; title: string; body: string; cta?: { label: string; href: string } }) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f5f0e6;font-family:Helvetica,Arial,sans-serif;color:#15130f">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border:1px solid #d9d0bd;border-radius:16px">
<tr><td style="padding:28px 32px 0;font-weight:700;font-size:18px">yeswe<em style="font-family:Georgia,serif;font-weight:400">content</em></td></tr>
<tr><td style="padding:16px 32px 8px"><h1 style="margin:0;font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2">${esc(title)}</h1></td></tr>
<tr><td style="padding:8px 32px 8px;font-size:15px;line-height:1.6;color:#4a453c">${body}</td></tr>
${
  cta
    ? `<tr><td style="padding:16px 32px 28px"><a href="${esc(cta.href)}" style="display:inline-block;background:#ff4f1f;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;border:2px solid #15130f">${esc(cta.label)}</a></td></tr>`
    : ""
}
<tr><td style="padding:16px 32px 28px;font-size:12px;color:#8a8375;border-top:1px solid #ece5d6">Recibes este email porque tienes una cuenta en yeswecontent. <a href="${siteUrl}/panel/ajustes" style="color:#8a8375">Gestionar avisos</a></td></tr>
</table></td></tr></table></body></html>`;
}

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:no-op] ${subject} → ${to}`);
    return { sent: false };
  }
  client ??= new Resend(key);
  const { data, error } = await client.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[email] Resend:", error.message);
    return { sent: false, error: error.message };
  }
  return { sent: true, id: data?.id };
}

export function sendWelcomeEmail(to: string, name?: string | null) {
  const hi = name ? `Hola, ${esc(name.split(" ")[0])}:` : "Hola:";
  return send(
    to,
    "Bienvenida a yeswecontent: tu primer plan editorial está en camino",
    layout({
      preheader: "Tres pasos y tu web empieza a publicar sola.",
      title: "Ya estás dentro",
      body: `<p>${hi}</p><p>Gracias por confiar en nosotros. Para que el primer artículo salga con tu voz, termina estos tres pasos:</p>
<ol><li>Cuéntanos a qué se dedica tu negocio y a quién le hablas.</li><li>Conecta tu CMS para publicar sin copiar y pegar.</li><li>Revisa el plan de temas que proponemos y ajusta lo que quieras.</li></ol>
<p>En cuanto lo tengas, ponemos el piloto automático.</p>`,
      cta: { label: "Seguir con la configuración", href: `${siteUrl}/onboarding` },
    }),
  );
}

export function sendTrialEndingEmail(to: string, { siteName, endsAt }: { siteName: string; endsAt: Date }) {
  const when = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(endsAt);
  return send(
    to,
    `Tu prueba de ${siteName} termina el ${when}`,
    layout({
      preheader: "Si no haces nada, la suscripción se activa sola y seguimos publicando.",
      title: "Tu prueba está a punto de terminar",
      body: `<p>La prueba gratuita de <strong>${esc(siteName)}</strong> termina el <strong>${esc(when)}</strong>.</p>
<p>Si quieres seguir, no tienes que hacer nada: la suscripción se activará y el calendario de publicación continúa. Si prefieres cambiar de plan o cancelar, puedes hacerlo desde la facturación.</p>`,
      cta: { label: "Revisar mi plan", href: `${siteUrl}/panel` },
    }),
  );
}

export function sendArticlePublishedEmail(to: string, { title, url, siteName }: { title: string; url: string; siteName: string }) {
  return send(
    to,
    `Publicado en ${siteName}: ${title}`,
    layout({
      preheader: "Un artículo nuevo ya está en tu web.",
      title: "Artículo publicado",
      body: `<p>Acabamos de publicar <strong>${esc(title)}</strong> en ${esc(siteName)}.</p><p>Lo vigilaremos en Google y en los asistentes de IA para contarte cómo rinde.</p>`,
      cta: { label: "Ver el artículo", href: url },
    }),
  );
}

export function sendPaymentFailedEmail(to: string, { amount, portalUrl }: { amount?: string; portalUrl?: string }) {
  return send(
    to,
    "No hemos podido cobrar tu suscripción",
    layout({
      preheader: "Actualiza tu método de pago para que no se pare la publicación.",
      title: "Hubo un problema con el pago",
      body: `<p>El último cobro${amount ? ` de <strong>${esc(amount)}</strong>` : ""} no se ha podido completar. Suele pasar con tarjetas caducadas o límites del banco.</p>
<p>Reintentaremos el cobro en los próximos días. Mientras tanto, actualiza tu método de pago para que la publicación no se detenga.</p>`,
      cta: { label: "Actualizar método de pago", href: portalUrl ?? `${siteUrl}/panel` },
    }),
  );
}
