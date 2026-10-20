import { Card } from "@/components/ui";
import { getClientSiteSettings, getPortal } from "@/lib/clientes/data";
import { saveClientBranding } from "../../actions";
import { PField, PForm, PInput, PTextarea } from "../../_components/form";

export const metadata = { title: "Tu marca" };

const COLOR_LABELS = ["Principal", "Fondo", "Acento"];
const FALLBACK = ["#1f2937", "#ffffff", "#2563eb"];

export default async function ClientBrandingPage() {
  const { site } = await getPortal();
  const { brand } = await getClientSiteSettings(site.id);
  const colors = [0, 1, 2].map((i) => brand.colors?.[i] ?? FALLBACK[i]);

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="font-semibold">Kit de marca de {site.name}</h2>
      <p className="mb-5 text-sm text-ink-3">
        Lo usamos para escribir con tu tono y para que las imágenes de los artículos encajen con tu web. Cuanto más concreto, mejor.
      </p>
      <PForm action={saveClientBranding} submitLabel="Guardar kit de marca">
        <PField label="Logotipo (URL de la imagen)" htmlFor="logo_url" hint="Un PNG o SVG con fondo transparente. Pega el enlace a la imagen.">
          <PInput id="logo_url" name="logo_url" type="url" inputMode="url" defaultValue={brand.logo_url ?? ""} placeholder="https://tuempresa.es/logo.svg" />
        </PField>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink-2">Colores de marca</legend>
          <div className="grid grid-cols-3 gap-3">
            {colors.map((c, i) => (
              <label key={i} className="block">
                <input
                  type="color"
                  name={`color_${i + 1}`}
                  defaultValue={c}
                  className="block h-12 w-full cursor-pointer rounded-xl border border-line bg-card p-1"
                  aria-label={`Color ${COLOR_LABELS[i].toLowerCase()}`}
                />
                <span className="mt-1 block text-center text-xs text-ink-3">{COLOR_LABELS[i]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <PField label="Tipografías" htmlFor="fonts" hint="Por ejemplo: «Titulares en Playfair, texto en Inter».">
          <PInput id="fonts" name="fonts" defaultValue={brand.fonts ?? ""} />
        </PField>

        <PField label="Guía de estilo" htmlFor="guidelines" hint="Cómo hablas a tus clientes, qué te diferencia, palabras que usas y que no.">
          <PTextarea id="guidelines" name="guidelines" rows={5} defaultValue={brand.guidelines ?? ""} placeholder="Hablamos de tú, con frases cortas y sin tecnicismos…" />
        </PField>

        <div className="grid gap-5 sm:grid-cols-2">
          <PField label="Sí queremos" htmlFor="do" hint="Una idea por línea.">
            <PTextarea id="do" name="do" rows={4} defaultValue={(brand.do ?? []).join("\n")} placeholder="Mencionar la garantía de dos años" />
          </PField>
          <PField label="Evita" htmlFor="dont" hint="Una idea por línea.">
            <PTextarea id="dont" name="dont" rows={4} defaultValue={(brand.dont ?? []).join("\n")} placeholder="Hablar de precios concretos" />
          </PField>
        </div>
      </PForm>
    </Card>
  );
}
