import { SpecialistChat } from "@/components/panel/specialist/chat";
import { getCurrentSite } from "@/lib/data";
import { hasClaude, isDemo } from "@/lib/env";
import { getSpecialistContext, starterQuestions } from "@/lib/panel/specialist";
import type { ThreadSummary } from "@/lib/panel/specialist-types";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Especialista SEO" };

async function listThreads(siteId: string): Promise<ThreadSummary[]> {
  if (isDemo) return [];
  const sb = await createClient();
  const { data } = await sb.from("specialist_threads").select("id, title, created_at").eq("site_id", siteId).order("updated_at", { ascending: false }).limit(50);
  return (data ?? []) as ThreadSummary[];
}

export default async function EspecialistaPage() {
  const site = (await getCurrentSite())!;
  const [ctx, threads] = await Promise.all([getSpecialistContext(site), listThreads(site.id)]);

  // Los planes con especialista asignado (Cosecha) pueden hablar con una persona.
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;
  const booking = ctx.hasDedicatedSpecialist
    ? bookingUrl
      ? { href: bookingUrl, external: /^https?:\/\//i.test(bookingUrl) }
      : {
          href: `mailto:hola@yeswecontent.com?subject=${encodeURIComponent(`Quiero hablar con mi especialista · ${site.name}`)}`,
          external: false,
        }
    : null;

  return (
    <SpecialistChat
      key={site.id}
      siteName={site.name}
      persist={!isDemo}
      initialThreads={threads}
      starters={starterQuestions(ctx)}
      booking={booking}
      aiEnabled={hasClaude}
    />
  );
}
