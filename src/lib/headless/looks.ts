/** Estilos del blog alojado. Sin dependencias de servidor: lo usa el onboarding y el middleware. */

export type BlogLook = "editorial" | "claro" | "tienda" | "oscuro";
export type BlogColorId = "naranja" | "bosque" | "marino" | "terracota" | "tinta" | "noche";

export const BLOG_LOOKS: { id: BlogLook; label: string; hint: string; font: "sans" | "serif" }[] = [
  { id: "editorial", label: "Editorial", hint: "Como una revista", font: "serif" },
  { id: "claro", label: "Claro", hint: "Limpio y fácil de leer", font: "sans" },
  { id: "tienda", label: "Tienda", hint: "Fichas, para una tienda online", font: "sans" },
  { id: "oscuro", label: "Noche", hint: "Fondo oscuro", font: "sans" },
];

export const BLOG_COLORS: { id: BlogColorId; label: string; accent: string; background: string }[] = [
  { id: "naranja", label: "Naranja", accent: "#ff4f1f", background: "#fffaf7" },
  { id: "bosque", label: "Bosque", accent: "#1f6b45", background: "#f3faf6" },
  { id: "marino", label: "Marino", accent: "#1b3a6b", background: "#f4f7fb" },
  { id: "terracota", label: "Terracota", accent: "#b4532a", background: "#faf6f1" },
  { id: "tinta", label: "Tinta", accent: "#121212", background: "#ffffff" },
  { id: "noche", label: "Noche", accent: "#e8ff6a", background: "#141413" },
];

export type BlogThemeChoice = {
  look: BlogLook;
  accent: string;
  background: string;
  text: string;
  font: "sans" | "serif";
  logo_url?: string;
};

export function blogHostSuffix() {
  return process.env.NEXT_PUBLIC_BLOG_HOST_SUFFIX ?? "blogs.yeswecontent.com";
}

export function slugifyBlogName(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "blog";
}

export function platformBlogHost(slug: string) {
  return `${slug}.${blogHostSuffix()}`;
}

export function platformBlogUrl(slug: string) {
  return `https://${platformBlogHost(slug)}`;
}

/** Si el host es un subdominio nuestro (tienda.blogs.yeswecontent.com), devuelve el slug. */
export function blogSlugFromHost(host: string) {
  const suffix = `.${blogHostSuffix()}`;
  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(slug)) return null;
  return slug;
}

export function themeFromChoice(look: BlogLook, colorId: string, logoUrl?: string | null): BlogThemeChoice {
  const color = BLOG_COLORS.find((c) => c.id === colorId) ?? BLOG_COLORS[0];
  const lookDef = BLOG_LOOKS.find((l) => l.id === look) ?? BLOG_LOOKS[1];
  const dark = look === "oscuro" || color.id === "noche";
  return {
    look: dark && look !== "oscuro" ? look : look,
    accent: color.accent,
    background: dark ? "#141413" : color.background,
    text: dark ? "#f5f5f4" : "#1c1917",
    font: look === "editorial" ? "serif" : lookDef.font,
    ...(logoUrl ? { logo_url: logoUrl } : {}),
  };
}
