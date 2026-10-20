/**
 * Proveedores de imágenes detrás de una única interfaz:
 *   const img = await generateImage(prompt, { aspect: "16:9", title, palette })
 * - OpenAI Images (OPENAI_API_KEY, modelo OPENAI_IMAGE_MODEL, por defecto gpt-image-1).
 * - Portada editorial con next/og como respaldo: funciona sin ninguna clave.
 */
import "server-only";
import { editorialBytes, type Aspect, type EditorialKind } from "./editorial";

export type { Aspect };

export interface ImageOptions {
  aspect?: Aspect;
  /** Datos para el respaldo editorial. */
  title?: string;
  kicker?: string;
  siteName?: string;
  palette?: string | null;
  kind?: EditorialKind;
  seed?: string;
  /** Fuerza un proveedor concreto. */
  provider?: "openai" | "editorial";
}

export interface GeneratedImage {
  bytes: Uint8Array;
  contentType: string;
  ext: string;
  provider: "openai" | "editorial";
}

export interface ImageProvider {
  name: GeneratedImage["provider"];
  available(): boolean;
  generate(prompt: string, opts: ImageOptions): Promise<GeneratedImage>;
}

export const hasOpenAIImages = () => !!process.env.OPENAI_API_KEY;
export const openAIImageModel = () => process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

const OPENAI_SIZES: Record<Aspect, { gpt: string; dalle: string }> = {
  "16:9": { gpt: "1536x1024", dalle: "1792x1024" },
  "4:3": { gpt: "1536x1024", dalle: "1792x1024" },
  "1:1": { gpt: "1024x1024", dalle: "1024x1024" },
};

export const openAIProvider: ImageProvider = {
  name: "openai",
  available: hasOpenAIImages,
  async generate(prompt, opts) {
    const model = openAIImageModel();
    const isDalle = model.startsWith("dall-e");
    const size = OPENAI_SIZES[opts.aspect ?? "16:9"][isDalle ? "dalle" : "gpt"];
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model,
        prompt: prompt.slice(0, 3800),
        n: 1,
        size,
        ...(isDalle ? { response_format: "b64_json", quality: "standard" } : { quality: "medium", output_format: "jpeg", output_compression: 85 }),
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`OpenAI Images ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
    const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
    const first = json.data?.[0];
    let bytes: Uint8Array | null = null;
    if (first?.b64_json) bytes = new Uint8Array(Buffer.from(first.b64_json, "base64"));
    else if (first?.url) bytes = new Uint8Array(await (await fetch(first.url)).arrayBuffer());
    if (!bytes?.length) throw new Error("OpenAI Images no devolvió ninguna imagen");
    return isDalle ? { bytes, contentType: "image/png", ext: "png", provider: "openai" } : { bytes, contentType: "image/jpeg", ext: "jpg", provider: "openai" };
  },
};

export const editorialProvider: ImageProvider = {
  name: "editorial",
  available: () => true,
  async generate(prompt, opts) {
    const bytes = await editorialBytes({
      title: opts.title || prompt.slice(0, 90),
      kicker: opts.kicker,
      siteName: opts.siteName,
      palette: opts.palette,
      kind: opts.kind,
      aspect: opts.aspect,
      seed: opts.seed,
    });
    return { bytes, contentType: "image/png", ext: "png", provider: "editorial" };
  },
};

const PROVIDERS = [openAIProvider, editorialProvider];

/** Genera una imagen con el mejor proveedor disponible; si falla, cae al editorial. */
export async function generateImage(prompt: string, opts: ImageOptions = {}): Promise<GeneratedImage> {
  const chain = opts.provider ? PROVIDERS.filter((p) => p.name === opts.provider) : PROVIDERS.filter((p) => p.available());
  let lastError: unknown = null;
  for (const p of chain) {
    try {
      return await p.generate(prompt, opts);
    } catch (e) {
      lastError = e;
      console.warn(`[images] ${p.name} falló:`, e instanceof Error ? e.message : e);
    }
  }
  if (opts.provider !== "editorial") return editorialProvider.generate(prompt, opts);
  throw lastError instanceof Error ? lastError : new Error("No se pudo generar la imagen");
}
