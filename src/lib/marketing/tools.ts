/** Catálogo de herramientas gratuitas (compartido entre cliente y servidor). */

export type ToolKind = "server" | "client" | "soon" | "signup";
export type ToolCategory = "ia" | "rastreo" | "onpage" | "datos" | "contenido" | "competencia";

export const toolCategories: { id: ToolCategory; label: string; intro: string }[] = [
  { id: "ia", label: "Visibilidad en IA", intro: "¿Te pueden leer, entender y citar los asistentes?" },
  { id: "rastreo", label: "Rastreo e indexación", intro: "Lo que ven los robots antes de leer una sola palabra." },
  { id: "onpage", label: "SEO on-page", intro: "Las etiquetas pequeñas que deciden el clic." },
  { id: "datos", label: "Datos estructurados", intro: "Contexto en formato máquina para Google y los LLM." },
  { id: "contenido", label: "Contenido", intro: "Ideas y textos con criterio." },
  { id: "competencia", label: "Competencia", intro: "Qué hacen los que salen por delante." },
];

export interface Tool {
  slug: string;
  name: string;
  category: ToolCategory;
  kind: ToolKind;
  tagline: string;
  /** Qué revisa o genera, en 3–5 viñetas */
  checks: string[];
  /** Por qué importa: un párrafo corto */
  why: string;
  cta?: string;
}

export const tools: Tool[] = [
  {
    slug: "auditoria-ia",
    name: "Auditoría exprés para IA",
    category: "ia",
    kind: "server",
    tagline: "Una nota de 0 a 100 sobre lo preparada que está tu web para buscadores y asistentes.",
    checks: ["Acceso de los rastreadores de IA en robots.txt", "Sitemap localizable", "Title, meta descripción, H1 y canonical", "Open Graph para compartir", "Datos estructurados JSON-LD", "Archivo llms.txt"],
    why: "Los asistentes no recomiendan lo que no pueden leer. Esta auditoría junta en un minuto las señales básicas que facilitan que Google y los LLM entiendan quién eres y qué ofreces.",
    cta: "Auditar mi web",
  },
  {
    slug: "robots-txt",
    name: "Comprobador de robots.txt",
    category: "rastreo",
    kind: "server",
    tagline: "Descubre si GPTBot, ClaudeBot, PerplexityBot o Google-Extended pueden entrar en tu web.",
    checks: ["Existencia y respuesta del archivo", "Reglas para cada rastreador de IA", "Sitemaps declarados", "Bloqueos accidentales de todo el sitio"],
    why: "Un robots.txt heredado de hace años puede estar dejando fuera a los asistentes que hoy responden las preguntas de tus clientes. O al revés: abriendo la puerta a quien no quieres.",
    cta: "Revisar robots.txt",
  },
  {
    slug: "sitemap",
    name: "Comprobador de sitemap",
    category: "rastreo",
    kind: "server",
    tagline: "Encuentra tu sitemap, cuenta las URL y prueba una muestra.",
    checks: ["Búsqueda en robots.txt y rutas habituales", "Índices de sitemaps", "Número de URL declaradas", "Estado HTTP de una muestra"],
    why: "El sitemap es el índice que entregas a los buscadores. Si tiene URL rotas o no existe, los robots tardan más en descubrir tus páginas nuevas.",
    cta: "Revisar sitemap",
  },
  {
    slug: "llms-txt",
    name: "Generador de llms.txt",
    category: "ia",
    kind: "server",
    tagline: "Crea un llms.txt a partir de los enlaces de tu página de inicio.",
    checks: ["Detecta si ya tienes uno", "Lee título y descripción", "Agrupa los enlaces internos principales", "Te da el archivo listo para subir"],
    why: "llms.txt es una propuesta abierta para ofrecer a los modelos un resumen ordenado de tu web. No es un estándar oficial, pero cuesta poco y ayuda a dar contexto.",
    cta: "Generar llms.txt",
  },
  {
    slug: "meta-descripcion",
    name: "Comprobador de meta descripción",
    category: "onpage",
    kind: "server",
    tagline: "¿Tu página tiene una descripción que invite a hacer clic?",
    checks: ["Presencia y duplicados", "Longitud recomendada", "Título de la página", "Vista previa aproximada"],
    why: "La meta descripción no posiciona por sí sola, pero es tu anuncio gratuito en los resultados. Una buena descripción sube el porcentaje de clics.",
    cta: "Revisar descripción",
  },
  {
    slug: "h1",
    name: "Comprobador de H1",
    category: "onpage",
    kind: "server",
    tagline: "Un titular principal, claro y único por página.",
    checks: ["Número de H1", "Longitud y contenido", "Coherencia con el title", "Uso de subtítulos H2"],
    why: "El H1 le dice a lectores y robots de qué va la página. Varias H1 o ninguna suelen ser síntoma de una plantilla mal resuelta.",
    cta: "Revisar H1",
  },
  {
    slug: "open-graph",
    name: "Comprobador de Open Graph",
    category: "onpage",
    kind: "server",
    tagline: "Cómo se verá tu enlace al compartirlo en WhatsApp, LinkedIn o Slack.",
    checks: ["og:title, og:description, og:image", "og:url y og:type", "Etiquetas de Twitter/X", "Vista previa de la tarjeta"],
    why: "Un enlace sin imagen ni título se ignora. Open Graph controla la tarjeta que aparece cada vez que alguien comparte tu contenido.",
    cta: "Revisar Open Graph",
  },
  {
    slug: "canonical",
    name: "Comprobador de canonical",
    category: "rastreo",
    kind: "server",
    tagline: "Evita que Google dude entre dos versiones de la misma página.",
    checks: ["Presencia de la etiqueta", "Duplicados", "Coincidencia con la URL final", "Redirecciones y meta robots"],
    why: "La canonical indica cuál es la versión buena de una página. Si apunta mal, puedes estar regalando tu autoridad a una URL que nadie visita.",
    cta: "Revisar canonical",
  },
  {
    slug: "vista-previa-serp",
    name: "Vista previa en Google",
    category: "onpage",
    kind: "client",
    tagline: "Escribe tu título y descripción y mira cómo quedarían en el buscador.",
    checks: ["Corte aproximado por píxeles", "Versión escritorio y móvil", "Contador de caracteres", "Avisos de longitud"],
    why: "Antes de publicar, comprueba que tu mensaje principal cabe y no queda cortado en mitad de la frase.",
  },
  {
    slug: "generador-schema",
    name: "Generador de schema JSON-LD",
    category: "datos",
    kind: "client",
    tagline: "FAQ, Article, Product y LocalBusiness sin escribir una llave a mano.",
    checks: ["Cuatro tipos habituales", "Campos guiados", "JSON-LD válido al instante", "Listo para copiar"],
    why: "Los datos estructurados describen tu contenido en un idioma que los buscadores y los modelos leen sin ambigüedad.",
  },
  {
    slug: "densidad-palabras",
    name: "Densidad de palabras clave",
    category: "contenido",
    kind: "client",
    tagline: "Pega un texto y mira qué términos dominan (y cuáles sobran).",
    checks: ["Palabras y bigramas más usados", "Sin palabras vacías en español", "Densidad de tu palabra clave", "Tiempo de lectura"],
    why: "No se trata de repetir una palabra hasta el aburrimiento, sino de comprobar que el texto habla de lo que crees que habla.",
  },
  {
    slug: "generador-robots",
    name: "Generador de robots.txt",
    category: "rastreo",
    kind: "client",
    tagline: "Decide qué rastreadores de IA entran y genera el archivo.",
    checks: ["Interruptores por rastreador", "Rutas privadas", "Sitemap", "Archivo listo para subir"],
    why: "Tú decides si quieres que tu contenido alimente a los asistentes. Este generador te deja tomar esa decisión con conocimiento de causa.",
  },
  {
    slug: "visibilidad-chatgpt",
    name: "¿Te recomienda ChatGPT?",
    category: "ia",
    kind: "signup",
    tagline: "Pregunta como lo haría tu cliente y mira si apareces.",
    checks: ["Prompts de tu sector", "Menciones y posición", "Competidores citados", "Evolución semanal"],
    why: "Esta comprobación lanza consultas reales contra los modelos, así que la hacemos dentro de la prueba gratuita.",
  },
  {
    slug: "visibilidad-perplexity",
    name: "Menciones en Perplexity",
    category: "ia",
    kind: "signup",
    tagline: "Qué fuentes cita Perplexity cuando preguntan por lo tuyo.",
    checks: ["Fuentes citadas", "Tu dominio en las respuestas", "Huecos de contenido", "Comparativa con competidores"],
    why: "Perplexity enlaza sus fuentes: saber cuáles usa te dice qué contenido necesitas para entrar en la lista.",
  },
  {
    slug: "ideas-articulos",
    name: "Ideas de artículos",
    category: "contenido",
    kind: "signup",
    tagline: "Diez temas con intención de búsqueda a partir de tu web.",
    checks: ["Temas por clúster", "Intención de búsqueda", "Volumen estimado", "Orden de prioridad"],
    why: "Es el mismo motor que construye el plan mensual. Lo tienes completo en la prueba.",
  },
  {
    slug: "indice-google",
    name: "¿Está indexada en Google?",
    category: "rastreo",
    kind: "soon",
    tagline: "Comprueba si una URL concreta aparece en el índice.",
    checks: ["Estado de indexación", "Fecha de último rastreo", "Motivos habituales de exclusión"],
    why: "Estamos preparando esta herramienta.",
  },
  {
    slug: "validador-schema",
    name: "Validador de datos estructurados",
    category: "datos",
    kind: "soon",
    tagline: "Lee el JSON-LD de una página y te dice qué falta.",
    checks: ["Tipos detectados", "Campos obligatorios", "Errores de sintaxis"],
    why: "Estamos preparando esta herramienta.",
  },
  {
    slug: "analisis-competidores",
    name: "Radar de competidores",
    category: "competencia",
    kind: "soon",
    tagline: "Quién se lleva tus palabras clave y con qué páginas.",
    checks: ["Dominios que compiten", "Páginas mejor posicionadas", "Temas que cubren y tú no"],
    why: "Estamos preparando esta herramienta.",
  },
  {
    slug: "brecha-palabras-clave",
    name: "Brecha de palabras clave",
    category: "competencia",
    kind: "soon",
    tagline: "Las búsquedas en las que tus rivales salen y tú no.",
    checks: ["Palabras compartidas", "Palabras exclusivas del rival", "Oportunidades rápidas"],
    why: "Estamos preparando esta herramienta.",
  },
];

export const serverToolSlugs = tools.filter((t) => t.kind === "server").map((t) => t.slug);
export const getTool = (slug: string) => tools.find((t) => t.slug === slug);

/* ───────────── Resultado común de las herramientas de servidor ───────────── */

export type CheckStatus = "pass" | "warn" | "fail" | "info";
export interface ToolCheck {
  label: string;
  status: CheckStatus;
  detail: string;
}
export interface ToolResult {
  tool: string;
  url: string;
  score?: number;
  summary: string;
  checks: ToolCheck[];
  table?: { caption: string; head: string[]; rows: string[][] };
  preview?: { kind: "serp" | "card"; title: string; description: string; url: string; image?: string; site?: string };
  output?: { filename: string; content: string };
}
