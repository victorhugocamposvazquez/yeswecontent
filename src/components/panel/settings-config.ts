export const SETTINGS_SECTIONS: { group: string; items: { id: string; label: string }[] }[] = [
  { group: "Cuenta", items: [{ id: "cuenta", label: "Cuenta" }, { id: "equipo", label: "Equipo" }, { id: "facturacion", label: "Facturación" }, { id: "referidos", label: "Referidos" }] },
  {
    group: "Contenido",
    items: [
      { id: "negocio", label: "Negocio" },
      { id: "escritura", label: "Voz de marca" },
      { id: "articulo", label: "Formato de artículo" },
      { id: "visual", label: "Estilo visual" },
      { id: "calendario", label: "Calendario" },
      { id: "mejoras", label: "Mejoras" },
      { id: "competidores", label: "Competidores" },
    ],
  },
  {
    group: "Conexiones",
    items: [
      { id: "publicacion", label: "Publicación" },
      { id: "analitica", label: "Analítica" },
      { id: "social", label: "Redes sociales" },
      { id: "catalogo", label: "Catálogo" },
    ],
  },
  { group: "Agencias", items: [{ id: "marca-blanca", label: "Marca blanca" }] },
];
