/**
 * Prueba social del hero.
 * TODO(lanzamiento): estos valores son PROVISIONALES. Sustituirlos por datos reales
 * de reseñas verificadas (p. ej. media y número de opiniones de una plataforma de reseñas)
 * antes de publicar la web. No lanzar con estas cifras.
 */
export const RATING = {
  score: 4.8,
  outOf: 5,
  label: "valoración media de clientes",
  /** Iniciales para los avatares decorativos (sin fotos de personas reales). */
  avatars: ["LR", "MA", "JP", "SC", "NB"],
} as const;

/**
 * Motores y plataformas donde te posicionamos. Logotipos monocromos en /public/logos
 * (marcas de sus respectivos titulares; ver nota en el pie).
 */
export const ENGINES = [
  { name: "Google", logo: "/logos/google.svg" },
  { name: "ChatGPT", logo: "/logos/openai.svg" },
  { name: "Gemini", logo: "/logos/googlegemini.svg" },
  { name: "Perplexity", logo: "/logos/perplexity.svg" },
  { name: "Claude", logo: "/logos/claude.svg" },
  { name: "Reddit", logo: "/logos/reddit.svg" },
  { name: "Quora", logo: "/logos/quora.svg" },
] as const;

/** Motores que rotan en el titular del hero. */
export const ROTATING_ENGINES = ENGINES.slice(0, 5);
