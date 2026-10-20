/** Red de ejemplo para el modo demo: webs de otros clientes con sus artículos. */
import type { NetworkPage, NetworkSite } from "./types";

const site = (id: string, url: string, name: string, niche: string, description: string, dr: number, anchors: string, extra: Partial<NetworkSite> = {}): NetworkSite => ({
  id,
  url,
  name,
  niche,
  description,
  language: "es",
  domain_rating: dr,
  prefs: { opt_in: true, anchors, min_dr: 15, exclude: [] },
  balance: 6,
  monthly_cap: 20,
  received_this_month: 2,
  workspace_id: `w_${id}`,
  ...extra,
});

export const demoNetworkSites: NetworkSite[] = [
  site("n_casaycampo", "https://casaycampo-blog.es", "Casa y Campo", "Decoración rústica y vida en el campo", "Blog de decoración natural, mesas de temporada y casas de pueblo.", 46, "decoración de mesa, mesa de otoño, decoración rústica"),
  site("n_cocina", "https://cocinadetemporada.com", "Cocina de Temporada", "Recetas de temporada y emplatado", "Recetas sencillas con producto de temporada y trucos para emplatar en casa.", 52, "emplatar en casa, recetas de otoño, presentación de platos"),
  site("n_hosteleria", "https://hosteleriahoy.net", "Hostelería Hoy", "Gestión de restaurantes y hostelería", "Noticias, proveedores y gestión para restaurantes y bares.", 61, "abrir un restaurante, proveedores de hostelería, gestión de restaurantes"),
  site("n_regalos", "https://regalosconalma.es", "Regalos con Alma", "Regalos originales y artesanos", "Tienda de regalos hechos a mano para bodas, aniversarios y empresas.", 38, "regalos de boda originales, regalos artesanos, lista de bodas"),
  site("n_cafe", "https://cafeteriasconencanto.es", "Cafeterías con Encanto", "Café de especialidad", "Guía de cafeterías de especialidad y métodos para preparar café en casa.", 29, "café de especialidad, preparar café en casa, métodos de café", { balance: 1 }),
  site("n_flores", "https://floresdelsur.es", "Flores del Sur", "Floristería y flores secas", "Floristería online con ramos frescos y composiciones de flores secas.", 34, "flores secas, ramos de flores secas, cómo secar flores"),
  site("n_brico", "https://bricoymas.es", "Brico y Más", "Bricolaje y reparaciones en casa", "Tutoriales de bricolaje, restauración y reparaciones domésticas.", 44, "reparar en casa, resina epoxi, restaurar objetos", { balance: 0 }),
  site("n_seguros", "https://seguroshogar24.es", "Seguros Hogar 24", "Seguros de hogar", "Comparador de seguros de hogar y consejos para reclamar daños.", 57, "seguro de hogar, comparar seguros"),
  site("n_spam", "https://granjadeenlaces.xyz", "Granja", "Cerámica y vajilla", "Directorio de cerámica.", 4, "ceramica barata"),
  site("n_huerto", "https://huertovertical.com", "Huerto Vertical", "Jardines verticales para interior", "Jardines verticales, plantas de interior y huertos urbanos.", 31, "plantas de interior, jardín vertical, huerto urbano", { workspace_id: "w_demo" }),
];

const page = (siteId: string, path: string, title: string, keyword: string, cluster: string): NetworkPage => {
  const s = demoNetworkSites.find((x) => x.id === siteId)!;
  return { site_id: siteId, url: `${s.url}${path}`, title, keyword, cluster };
};

export const demoNetworkPages: NetworkPage[] = [
  page("n_casaycampo", "/mesas-otono", "Cómo decorar una mesa de otoño con elementos naturales", "mesa de otoño", "Decoración"),
  page("n_casaycampo", "/decorar-con-flores-secas", "Ideas para decorar la casa con flores secas", "decorar con flores secas", "Decoración"),
  page("n_cocina", "/emplatar", "Cómo emplatar en casa como en un restaurante", "emplatar en casa", "Técnicas"),
  page("n_cocina", "/recetas-otono", "Recetas de otoño con calabaza y setas", "recetas de otoño", "Recetas"),
  page("n_hosteleria", "/proveedores", "Proveedores para abrir un restaurante: la lista completa", "proveedores restaurante", "Gestión"),
  page("n_hosteleria", "/menaje-restaurante", "Menaje y vajilla para restaurantes: cómo calcular lo que necesitas", "vajilla para restaurantes", "Gestión"),
  page("n_regalos", "/regalos-boda", "Regalos de boda originales que los novios sí usarán", "regalos de boda originales", "Bodas"),
  page("n_cafe", "/guia", "Guía de cafeterías de especialidad en España", "cafeterías de especialidad", "Guías"),
  page("n_cafe", "/cafe-en-casa", "Cómo preparar café de especialidad en casa: métodos y tazas", "café en casa", "Métodos"),
  page("n_flores", "/secar-flores", "Cómo secar flores en casa paso a paso", "secar flores", "Flores secas"),
  page("n_brico", "/reparar-ceramica", "Cómo reparar cerámica rota con resina", "reparar cerámica", "Reparaciones"),
  page("n_seguros", "/seguro-hogar-roturas", "Qué cubre el seguro de hogar en caso de roturas", "seguro de hogar roturas", "Seguros"),
  page("n_spam", "/ceramica", "Cerámica barata vajilla platos tazas", "ceramica barata", "Cerámica"),
  page("n_huerto", "/plantas-interior", "Plantas de interior que necesitan poca luz", "plantas de interior", "Plantas"),
];
