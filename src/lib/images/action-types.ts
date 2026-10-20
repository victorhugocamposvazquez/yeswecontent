import type { ArticleImage } from "@/lib/types";

export type ImageActionState = {
  ok: boolean;
  message: string;
  at: number;
  kind?: ArticleImage["kind"];
  image?: ArticleImage;
  /** URL de la imagen sustituida en el texto (si la había). */
  replaced?: string | null;
  /** Cuerpo resultante cuando la imagen se añade al texto. */
  body_md?: string;
} | null;

export type ImageAction = (prev: ImageActionState, fd: FormData) => Promise<ImageActionState>;
