/**
 * Motores y plataformas donde te posicionamos. Logotipos monocromos en /public/logos
 * (marcas de sus respectivos titulares; ver nota en el pie).
 *
 * No hay puntuación de reseñas en el hero: cuando haya datos verificados de una
 * plataforma real, reintroducir una píldora de valoración con esas cifras.
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
