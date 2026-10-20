/** Contenido de las páginas de producto (/producto/[slug]). Textos propios de yeswecontent. */

export type ProductIcon =
  | "bot"
  | "pen"
  | "calendar"
  | "send"
  | "link"
  | "network"
  | "sparkles"
  | "scan"
  | "share"
  | "bag";

export interface Product {
  slug: string;
  name: string;
  /** Línea corta para menús */
  short: string;
  icon: ProductIcon;
  eyebrow: string;
  /** Titular: [antes, palabra marcada, después] */
  title: [string, string, string];
  intro: string;
  features: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  /** Ficha de ejemplo que acompaña al hero */
  sample: { heading: string; rows: { k: string; v: string; tone?: "ok" | "warn" | "signal" }[]; note: string };
  faq: { q: string; a: string }[];
  related: string[];
  metaDescription: string;
}

export const products: Product[] = [
  {
    slug: "agente-seo",
    name: "Agente SEO",
    short: "Todo el ciclo, en piloto automático",
    icon: "bot",
    eyebrow: "Agente SEO",
    title: ["Un equipo de contenido que ", "no se va de vacaciones", "."],
    intro:
      "El agente investiga, planifica, escribe, publica, enlaza y mide. Tú apruebas lo que quieras aprobar y el resto sucede solo, cada semana, sin reuniones de seguimiento.",
    features: [
      { title: "Investiga tu mercado", text: "Analiza tu web, tu sector y a tus competidores para entender en qué búsquedas tienes opciones reales." },
      { title: "Decide qué toca este mes", text: "Prioriza temas por intención y dificultad, y reparte el calendario para que publiques con constancia." },
      { title: "Escribe y publica", text: "Redacta con tu voz, añade FAQ, schema e imágenes y lo sube a tu CMS el día previsto." },
      { title: "Aprende de los datos", text: "Cruza Search Console y las respuestas de la IA para reforzar lo que funciona y reescribir lo que cae." },
    ],
    steps: [
      { title: "Conecta tu web", text: "Nos das la URL y, si quieres, acceso a tu CMS y a Search Console." },
      { title: "Ajusta el criterio", text: "Revisas tono, temas prohibidos y frecuencia. Cinco minutos." },
      { title: "Déjalo trabajar", text: "Cada lunes tienes un resumen de lo publicado y lo que viene." },
    ],
    sample: {
      heading: "Semana 42 · resumen del agente",
      rows: [
        { k: "Artículos publicados", v: "5", tone: "ok" },
        { k: "Artículos actualizados", v: "2" },
        { k: "Enlaces internos añadidos", v: "31" },
        { k: "Nuevas menciones en IA", v: "+3", tone: "signal" },
      ],
      note: "Ejemplo ilustrativo con datos ficticios.",
    },
    faq: [
      { q: "¿Puedo revisar antes de publicar?", a: "Sí. Puedes activar la revisión manual para todo, solo para ciertas categorías o para nada. Lo cambias cuando quieras." },
      { q: "¿Sustituye a mi equipo de marketing?", a: "Le quita la parte repetitiva. La estrategia de marca, los lanzamientos y el criterio siguen siendo vuestros." },
    ],
    related: ["plan-de-contenidos", "redactor-ia", "autopublicacion"],
    metaDescription: "Un agente que investiga, planifica, escribe, publica y mide tu SEO cada semana. Tú decides cuánto quieres supervisar.",
  },
  {
    slug: "redactor-ia",
    name: "Redactor IA",
    short: "Artículos con tu voz y nota de calidad",
    icon: "pen",
    eyebrow: "Redactor IA",
    title: ["Artículos que suenan a ", "tu marca", ", no a plantilla."],
    intro:
      "Aprendemos cómo hablas a partir de tu web y de los ejemplos que nos des. Cada texto sale con estructura pensada para buscar y para leer, y con una nota de calidad de 0 a 100 que explica qué mejorar.",
    features: [
      { title: "Voz de marca", text: "Tuteo o usted, frases cortas o largas, palabras que nunca usarías. Lo definimos una vez y se respeta siempre." },
      { title: "Nota de calidad 0–100", text: "Puntuamos legibilidad, cobertura del tema, estructura, originalidad y señales SEO antes de publicar." },
      { title: "Listo para los buscadores", text: "Meta descripción, FAQ, datos estructurados JSON-LD y enlaces internos incluidos de serie." },
      { title: "Imágenes a juego", text: "Portadas e ilustraciones en el estilo visual que elijas, con textos alternativos descriptivos." },
      { title: "Datos con fuente", text: "Cuando citamos una cifra, enlazamos de dónde sale. Sin inventos." },
    ],
    steps: [
      { title: "Lee tu web", text: "Extraemos tono, vocabulario y estructura de tus mejores páginas." },
      { title: "Escribe un borrador", text: "Con esquema, respuestas directas a las preguntas clave y ejemplos." },
      { title: "Lo puntúa y lo pule", text: "Si baja de tu umbral de calidad, se reescribe antes de llegar a ti." },
    ],
    sample: {
      heading: "Control de calidad · borrador #128",
      rows: [
        { k: "Nota global", v: "92/100", tone: "ok" },
        { k: "Legibilidad", v: "Alta" },
        { k: "Preguntas frecuentes", v: "6 incluidas" },
        { k: "Schema", v: "Article + FAQPage", tone: "signal" },
      ],
      note: "Ejemplo ilustrativo.",
    },
    faq: [
      { q: "¿Google penaliza el contenido hecho con IA?", a: "Google penaliza el contenido inútil, lo escriba quien lo escriba. Por eso medimos calidad y añadimos experiencia real de tu marca en cada texto." },
      { q: "¿Qué longitud tienen los artículos?", a: "La que pida el tema. Fijas un mínimo y el redactor se adapta a lo que necesita la búsqueda, normalmente entre 1.200 y 2.500 palabras." },
    ],
    related: ["plan-de-contenidos", "enlazado-interno", "autopublicacion"],
    metaDescription: "Artículos con la voz de tu marca, nota de calidad de 0 a 100, FAQ, JSON-LD, imágenes y enlaces internos incluidos.",
  },
  {
    slug: "plan-de-contenidos",
    name: "Plan de contenidos",
    short: "Un calendario mensual con criterio",
    icon: "calendar",
    eyebrow: "Plan de contenidos",
    title: ["Cada mes, una lista de temas ", "con sentido", "."],
    intro:
      "Nada de escribir por escribir. Partimos de una investigación de palabras clave y de lo que ya tienes publicado para construir un calendario que crece por clústeres y no se pisa a sí mismo.",
    features: [
      { title: "Investigación de palabras clave", text: "Volumen, dificultad e intención de cada búsqueda, filtrados por lo que tu web puede ganar." },
      { title: "Clústeres temáticos", text: "Agrupamos temas para que tus artículos se refuercen entre sí y ganes autoridad en lo tuyo." },
      { title: "Actualizaciones", text: "Detectamos artículos antiguos que pierden posiciones y los metemos en el plan para renovarlos." },
      { title: "Tú tienes la última palabra", text: "Arrastra, descarta o añade temas. El plan se recoloca solo." },
    ],
    steps: [
      { title: "Análisis", text: "Revisamos tu web, tus competidores y tus datos de Search Console." },
      { title: "Propuesta", text: "Recibes el calendario del mes con el porqué de cada tema." },
      { title: "Ejecución", text: "Cada tema aprobado pasa al redactor en su fecha." },
    ],
    sample: {
      heading: "Plan de noviembre · 20 temas",
      rows: [
        { k: "Informacionales", v: "12" },
        { k: "Comerciales", v: "6" },
        { k: "Actualizaciones", v: "2", tone: "warn" },
        { k: "Volumen potencial", v: "18.400 búsq./mes", tone: "signal" },
      ],
      note: "Ejemplo ilustrativo.",
    },
    faq: [
      { q: "¿De dónde salen los datos de volumen?", a: "Combinamos fuentes de terceros con tus propios datos de Search Console cuando lo conectas. Son estimaciones, y lo decimos así." },
      { q: "¿Puedo proponer mis propios temas?", a: "Claro. Añádelos al calendario y el sistema los integra en el clúster que corresponda." },
    ],
    related: ["redactor-ia", "agente-seo", "enlazado-interno"],
    metaDescription: "Un calendario mensual de contenidos basado en investigación de palabras clave, clústeres y actualización de artículos antiguos.",
  },
  {
    slug: "autopublicacion",
    name: "Autopublicación",
    short: "WordPress, Shopify, Webflow, Ghost o API",
    icon: "send",
    eyebrow: "Autopublicación",
    title: ["Publica sin abrir ", "el gestor de contenidos", "."],
    intro:
      "Conectamos con tu CMS una vez y a partir de ahí cada artículo llega maquetado, con imágenes, categorías y metadatos, el día y a la hora que hayas elegido.",
    features: [
      { title: "Integraciones nativas", text: "WordPress, Shopify, Webflow y Ghost. Para todo lo demás, webhook o API." },
      { title: "Calendario a tu ritmo", text: "Elige días y hora, o publica en lote. Cambia el ritmo cuando quieras." },
      { title: "Todo en su sitio", text: "Slug, categoría, autor, imagen destacada, meta descripción y schema ya colocados." },
      { title: "Sin sorpresas", text: "Si una publicación falla, te avisamos y la reintentamos. Nada se pierde." },
    ],
    steps: [
      { title: "Conecta", text: "Credenciales de aplicación o clave de API, según tu plataforma." },
      { title: "Elige el ritmo", text: "Por ejemplo: lunes, miércoles y viernes a las 9:00." },
      { title: "Olvídate", text: "Lo publicado aparece en tu panel con su URL." },
    ],
    sample: {
      heading: "Cola de publicación",
      rows: [
        { k: "Lun 09:00 · WordPress", v: "Publicado", tone: "ok" },
        { k: "Mié 09:00 · WordPress", v: "Programado" },
        { k: "Vie 09:00 · WordPress", v: "Programado" },
        { k: "Webhook de respaldo", v: "Activo", tone: "signal" },
      ],
      note: "Ejemplo ilustrativo.",
    },
    faq: [
      { q: "¿Necesito un desarrollador?", a: "Para WordPress, Shopify, Webflow y Ghost, no. Para el webhook, basta con alguien que sepa recibir un JSON." },
      { q: "¿Puedo publicar como borrador?", a: "Sí, puedes enviar los artículos como borradores a tu CMS y publicarlos tú." },
    ],
    related: ["redactor-ia", "shopify", "enlazado-interno"],
    metaDescription: "Publicación automática en WordPress, Shopify, Webflow, Ghost o por webhook, con calendario, imágenes y metadatos.",
  },
  {
    slug: "enlazado-interno",
    name: "Enlazado interno",
    short: "Cada artículo, conectado con el resto",
    icon: "link",
    eyebrow: "Enlazado interno",
    title: ["Tus páginas, ", "hablándose entre sí", "."],
    intro:
      "Un buen enlazado interno reparte autoridad y guía al lector. Lo hacemos en cada artículo nuevo y, de paso, volvemos a los antiguos para que apunten a lo recién publicado.",
    features: [
      { title: "Anclas naturales", text: "Enlazamos donde tiene sentido para el lector, con textos variados y nada forzados." },
      { title: "Enlaces de ida y vuelta", text: "El artículo nuevo enlaza a los antiguos y los antiguos reciben un enlace al nuevo." },
      { title: "Páginas de dinero", text: "Marca tus páginas de producto o servicio prioritarias y recibirán enlaces con prioridad." },
      { title: "Sin enlaces rotos", text: "Revisamos periódicamente que todos los destinos sigan respondiendo." },
    ],
    steps: [
      { title: "Mapa del sitio", text: "Leemos tu sitemap y entendemos de qué va cada página." },
      { title: "Sugerencias", text: "Proponemos enlaces por relevancia semántica." },
      { title: "Inserción", text: "Se añaden al publicar, o los apruebas tú si lo prefieres." },
    ],
    sample: {
      heading: "Artículo: Cómo cuidar el gres",
      rows: [
        { k: "Enlaces salientes", v: "6" },
        { k: "Enlaces entrantes nuevos", v: "4", tone: "ok" },
        { k: "Páginas de producto enlazadas", v: "2", tone: "signal" },
        { k: "Enlaces rotos", v: "0" },
      ],
      note: "Ejemplo ilustrativo.",
    },
    faq: [
      { q: "¿Tocáis mis páginas antiguas?", a: "Solo si lo activas, y siempre añadiendo enlaces, nunca reescribiendo tu texto." },
      { q: "¿Cuántos enlaces por artículo?", a: "Tú pones el número objetivo. Por defecto entre 3 y 8, según la longitud." },
    ],
    related: ["red-de-enlaces", "redactor-ia", "auditoria-geo"],
    metaDescription: "Enlazado interno automático en cada artículo nuevo y en los antiguos, con anclas naturales y prioridad para tus páginas clave.",
  },
  {
    slug: "red-de-enlaces",
    name: "Red de enlaces",
    short: "Autoridad sin hacer outreach",
    icon: "network",
    eyebrow: "Red de enlaces",
    title: ["Enlaces de calidad ", "sin mandar un solo email", "."],
    intro:
      "Los clientes de yeswecontent forman una red de intercambio: webs reales del mismo sector o de sectores afines se enlazan entre sí dentro de artículos útiles. Cuantas más webs se suman, más fuerte es la red para todos.",
    features: [
      { title: "Afinidad temática", text: "Solo emparejamos webs con temáticas relacionadas. Un enlace de una tienda de cerámica a una de bicicletas no le sirve a nadie." },
      { title: "Dentro de contenido real", text: "Los enlaces viven en artículos que alguien querría leer, no en páginas de enlaces." },
      { title: "Sin intercambios recíprocos obvios", text: "Repartimos los enlaces en triángulos para que no parezcan acuerdos de 'tú a mí, yo a ti'." },
      { title: "Control total", text: "Revisa cada enlace recibido y dado, y excluye las webs que no quieras." },
    ],
    steps: [
      { title: "Te unes a la red", text: "Revisamos que tu web cumpla unos mínimos de calidad." },
      { title: "Ganas créditos", text: "Cada enlace que das en tus artículos suma créditos." },
      { title: "Recibes enlaces", text: "Los créditos se convierten en enlaces desde webs afines." },
    ],
    sample: {
      heading: "Red de enlaces · este mes",
      rows: [
        { k: "Enlaces recibidos", v: "7", tone: "ok" },
        { k: "Enlaces dados", v: "6" },
        { k: "Rating medio de dominio", v: "34" },
        { k: "Créditos disponibles", v: "12", tone: "signal" },
      ],
      note: "Ejemplo ilustrativo.",
    },
    faq: [
      { q: "¿Es seguro para Google?", a: "Evitamos los patrones que Google asocia a esquemas de enlaces: nada de granjas, nada de reciprocidad directa y siempre con relevancia temática. Aun así, ningún enlace está libre de riesgo, y por eso puedes revisar y rechazar cada uno." },
      { q: "¿Cuántos enlaces recibiré?", a: "Depende de tu plan y de los créditos que generes. Preferimos pocos y buenos a muchos y dudosos." },
    ],
    related: ["enlazado-interno", "auditoria-geo", "agente-seo"],
    metaDescription: "Una red de intercambio de enlaces entre clientes de sectores afines, dentro de contenido real y con control total.",
  },
  {
    slug: "visibilidad-ia",
    name: "Visibilidad en IA",
    short: "Saber cuándo te recomienda la IA",
    icon: "sparkles",
    eyebrow: "Visibilidad en IA",
    title: ["Entérate de cuándo ", "la IA te recomienda", " (y cuándo no)."],
    intro:
      "Elige las preguntas que haría tu cliente ideal. Cada día se las hacemos a ChatGPT, Claude, Gemini y Perplexity y apuntamos si te mencionan, en qué posición, qué fuentes citan y qué competidores aparecen.",
    features: [
      { title: "Cuatro modelos", text: "ChatGPT, Claude, Gemini y Perplexity, con el historial de cada uno por separado." },
      { title: "Posición y contexto", text: "No solo si sales: en qué lugar, con qué frase y junto a quién." },
      { title: "Fuentes citadas", text: "Las URL que usan los modelos para responder te dicen qué contenido crear o mejorar." },
      { title: "Tráfico desde IA", text: "Medimos las visitas que llegan desde chatgpt.com, perplexity.ai y compañía." },
    ],
    steps: [
      { title: "Define tus preguntas", text: "Te sugerimos prompts de tu sector y añades los tuyos." },
      { title: "Rastreo diario", text: "Lanzamos las consultas y guardamos cada respuesta." },
      { title: "Plan de acción", text: "Lo que falta se convierte en temas del plan de contenidos." },
    ],
    sample: {
      heading: "«mejor cerámica artesanal online»",
      rows: [
        { k: "ChatGPT", v: "Mencionada · #2", tone: "ok" },
        { k: "Claude", v: "Mencionada · #3", tone: "ok" },
        { k: "Gemini", v: "No aparece", tone: "warn" },
        { k: "Perplexity", v: "Citada como fuente", tone: "signal" },
      ],
      note: "Ejemplo ilustrativo con una marca ficticia.",
    },
    faq: [
      { q: "¿Las respuestas de la IA no cambian cada vez?", a: "Sí, por eso preguntamos a diario y miramos la tendencia, no una respuesta aislada." },
      { q: "¿Cuántas preguntas puedo seguir?", a: "Depende del plan. Mira la tabla de precios para el detalle." },
    ],
    related: ["auditoria-geo", "agente-seo", "redactor-ia"],
    metaDescription: "Seguimiento diario de tus menciones en ChatGPT, Claude, Gemini y Perplexity: posición, fuentes citadas y competidores.",
  },
  {
    slug: "auditoria-geo",
    name: "Auditoría técnica y GEO",
    short: "Lo que frena tu posicionamiento",
    icon: "scan",
    eyebrow: "Auditoría técnica y GEO",
    title: ["Arregla lo que ", "te está frenando", "."],
    intro:
      "Revisamos tu web como lo harían Google y los asistentes de IA: rastreo, indexación, velocidad, etiquetas, datos estructurados y legibilidad para modelos. Cada problema viene con su explicación y su arreglo, y el informe se puede compartir con un enlace.",
    features: [
      { title: "Técnica clásica", text: "Errores de rastreo, redirecciones, canonicals, títulos duplicados, imágenes sin alt." },
      { title: "Preparación para IA", text: "Acceso de rastreadores de IA, llms.txt, respuestas directas y datos estructurados." },
      { title: "Prioridades claras", text: "Ordenamos por impacto: primero lo que más pesa, después lo cosmético." },
      { title: "Informe compartible", text: "Un enlace público para enseñárselo a tu desarrollador o a tu cliente." },
    ],
    steps: [
      { title: "Rastreo", text: "Recorremos tu web y descargamos lo necesario." },
      { title: "Diagnóstico", text: "Cada comprobación sale en verde, ámbar o rojo con su explicación." },
      { title: "Seguimiento", text: "Repetimos la auditoría cada mes para ver la evolución." },
    ],
    sample: {
      heading: "Auditoría · tierrafina.es",
      rows: [
        { k: "Nota global", v: "78/100", tone: "warn" },
        { k: "Rastreadores de IA", v: "Permitidos", tone: "ok" },
        { k: "Páginas sin meta descripción", v: "14", tone: "warn" },
        { k: "llms.txt", v: "No existe", tone: "signal" },
      ],
      note: "Ejemplo ilustrativo.",
    },
    faq: [
      { q: "¿Puedo probarla gratis?", a: "Sí, hay una versión exprés en las herramientas gratuitas. La completa está incluida en todos los planes." },
      { q: "¿Arregláis vosotros los problemas?", a: "Lo que afecta al contenido, sí. Lo que requiere tocar tu servidor o plantilla te lo explicamos paso a paso." },
    ],
    related: ["visibilidad-ia", "enlazado-interno", "agente-seo"],
    metaDescription: "Auditoría técnica y de preparación para IA con prioridades claras y un informe que puedes compartir con un enlace.",
  },
  {
    slug: "social",
    name: "Reddit, Quora y carruseles",
    short: "Tu contenido, también en conversaciones",
    icon: "share",
    eyebrow: "Visibilidad social",
    title: ["Aparece donde la gente ", "pregunta de verdad", "."],
    intro:
      "Los asistentes de IA beben mucho de Reddit y Quora. Detectamos hilos donde tu experiencia encaja y te proponemos respuestas útiles basadas en tus artículos. Y cada artículo puede convertirse en un carrusel para Instagram o Facebook.",
    features: [
      { title: "Agentes de Reddit y Quora", text: "Buscan preguntas relevantes y redactan respuestas que aportan, no que venden." },
      { title: "Tú publicas", text: "Revisas, editas y publicas desde tu cuenta. Nada sale sin tu permiso." },
      { title: "Carruseles automáticos", text: "Cada artículo, resumido en 6–8 diapositivas con tu estilo visual." },
      { title: "Calendario social", text: "Frecuencia semanal o diaria, según tu plan." },
    ],
    steps: [
      { title: "Escucha", text: "Rastreamos hilos y preguntas de tu temática." },
      { title: "Propuesta", text: "Respuesta o carrusel a partir de tu contenido." },
      { title: "Publicación", text: "Apruebas y publicas con un clic." },
    ],
    sample: {
      heading: "Sugerencias de hoy",
      rows: [
        { k: "Reddit · r/Ceramics", v: "Respuesta lista" },
        { k: "Quora · esmaltes sin plomo", v: "Respuesta lista" },
        { k: "Instagram · carrusel", v: "8 diapositivas", tone: "signal" },
        { k: "Facebook · carrusel", v: "Programado", tone: "ok" },
      ],
      note: "Ejemplo ilustrativo.",
    },
    faq: [
      { q: "¿Publicáis en mi nombre en Reddit?", a: "No. Te damos la respuesta redactada y el enlace al hilo; la publicas tú. Así respetas las normas de cada comunidad." },
      { q: "¿Los carruseles llevan mi marca?", a: "Sí: tus colores, tu tipografía aproximada y tu logo." },
    ],
    related: ["redactor-ia", "visibilidad-ia", "agente-seo"],
    metaDescription: "Agentes que proponen respuestas útiles en Reddit y Quora y carruseles automáticos para Instagram y Facebook a partir de tus artículos.",
  },
  {
    slug: "shopify",
    name: "Para Shopify",
    short: "Contenido que vende tu catálogo",
    icon: "bag",
    eyebrow: "yeswecontent para Shopify",
    title: ["Un blog que ", "lleva a tus productos", "."],
    intro:
      "Conectamos con tu tienda Shopify, leemos el catálogo y escribimos guías, comparativas y artículos de uso que enlazan a las fichas de producto adecuadas. Publicación directa en el blog de tu tienda.",
    features: [
      { title: "Lee tu catálogo", text: "Productos, colecciones y precios para escribir con datos reales." },
      { title: "Enlaces a fichas", text: "Cada artículo recomienda los productos que encajan, con enlaces a la ficha." },
      { title: "Comparativas y guías", text: "Formatos que responden a búsquedas con intención de compra." },
      { title: "Blog de Shopify", text: "Se publica en tu blog nativo, con imágenes y etiquetas." },
    ],
    steps: [
      { title: "Instala la conexión", text: "Autoriza el acceso a productos y blog." },
      { title: "Elige colecciones", text: "Dinos qué quieres empujar este trimestre." },
      { title: "Vende con contenido", text: "Mide visitas y ventas atribuidas desde tu panel." },
    ],
    sample: {
      heading: "Artículo: Qué bici comprar para ir al trabajo",
      rows: [
        { k: "Productos enlazados", v: "5" },
        { k: "Colección", v: "Urbanas" },
        { k: "Publicado en", v: "Blog de Shopify", tone: "ok" },
        { k: "Clics a fichas (30 d)", v: "412", tone: "signal" },
      ],
      note: "Ejemplo ilustrativo con una tienda ficticia.",
    },
    faq: [
      { q: "¿Funciona con cualquier tema de Shopify?", a: "Sí, publicamos en el blog nativo, que todos los temas soportan." },
      { q: "¿Y si cambio un precio?", a: "No escribimos precios fijos en el texto; enlazamos a la ficha, que siempre está al día." },
    ],
    related: ["autopublicacion", "redactor-ia", "enlazado-interno"],
    metaDescription: "Contenido para tiendas Shopify que lee tu catálogo, enlaza a tus fichas de producto y se publica en tu blog.",
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
