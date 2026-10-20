/** Rastreadores de IA conocidos (compartido cliente/servidor). */
export const AI_CRAWLERS = [
  { agent: "GPTBot", owner: "OpenAI", purpose: "entrenamiento de modelos" },
  { agent: "OAI-SearchBot", owner: "OpenAI", purpose: "búsqueda en ChatGPT" },
  { agent: "ChatGPT-User", owner: "OpenAI", purpose: "visitas pedidas por usuarios" },
  { agent: "ClaudeBot", owner: "Anthropic", purpose: "entrenamiento de modelos" },
  { agent: "Claude-User", owner: "Anthropic", purpose: "visitas pedidas por usuarios" },
  { agent: "PerplexityBot", owner: "Perplexity", purpose: "índice de respuestas" },
  { agent: "Google-Extended", owner: "Google", purpose: "Gemini y entrenamiento" },
  { agent: "Applebot-Extended", owner: "Apple", purpose: "Apple Intelligence" },
  { agent: "CCBot", owner: "Common Crawl", purpose: "dataset abierto" },
];
