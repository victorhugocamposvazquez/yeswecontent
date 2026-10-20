"use client";

import { useState } from "react";
import type { FormAction } from "@/lib/panel/action-types";
import { PField, PForm, PInput, PSelect } from "./form";

type F = { key: string; label: string; type?: string; placeholder?: string; hint?: string };

const PROVIDERS: { id: string; label: string; help: string; fields: F[] }[] = [
  {
    id: "wordpress",
    label: "WordPress",
    help: "En tu WordPress ve a Usuarios › Perfil › Contraseñas de aplicación y crea una nueva.",
    fields: [
      { key: "url", label: "Dirección de tu web", type: "url", placeholder: "https://tuempresa.es" },
      { key: "username", label: "Usuario" },
      { key: "app_password", label: "Contraseña de aplicación", type: "password", hint: "No es tu contraseña habitual: es una específica para esta conexión." },
    ],
  },
  {
    id: "shopify",
    label: "Shopify",
    help: "Crea una app personalizada en Configuración › Apps con permiso de escritura de contenido.",
    fields: [
      { key: "shop", label: "Tienda", placeholder: "tutienda.myshopify.com" },
      { key: "access_token", label: "Token de acceso de la Admin API", type: "password" },
      { key: "blog_id", label: "ID del blog", placeholder: "123456789" },
    ],
  },
  {
    id: "webflow",
    label: "Webflow",
    help: "Genera un token de API en los ajustes del sitio y copia el ID de la colección del blog.",
    fields: [
      { key: "token", label: "Token de API", type: "password" },
      { key: "collection_id", label: "ID de la colección" },
    ],
  },
  {
    id: "ghost",
    label: "Ghost",
    help: "En Ghost ve a Ajustes › Integraciones, crea una personalizada y copia la Admin API key.",
    fields: [
      { key: "url", label: "Dirección de tu Ghost", type: "url", placeholder: "https://blog.tuempresa.es" },
      { key: "admin_key", label: "Admin API key", type: "password" },
    ],
  },
  {
    id: "webhook",
    label: "Otro (webhook)",
    help: "Te enviaremos cada artículo por POST firmado con tu secreto. Ideal para webs a medida.",
    fields: [
      { key: "url", label: "URL que recibe los artículos", type: "url", placeholder: "https://tuempresa.es/api/articulos" },
      { key: "secret", label: "Secreto compartido", type: "password" },
    ],
  },
];

export function CmsForm({ action, defaultProvider }: { action: FormAction; defaultProvider?: string }) {
  const [provider, setProvider] = useState(PROVIDERS.some((p) => p.id === defaultProvider) ? defaultProvider! : "wordpress");
  const current = PROVIDERS.find((p) => p.id === provider)!;
  return (
    <PForm action={action} submitLabel="Conectar" pendingLabel="Conectando…" resetOnSuccess>
      <PField label="Tu CMS" htmlFor="provider">
        <PSelect id="provider" name="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </PSelect>
      </PField>
      <p className="rounded-xl bg-paper-2 p-3 text-sm text-ink-2">{current.help}</p>
      {current.fields.map((f) => (
        <PField key={`${provider}_${f.key}`} label={f.label} htmlFor={`${provider}_${f.key}`} hint={f.hint}>
          <PInput
            id={`${provider}_${f.key}`}
            name={`${provider}_${f.key}`}
            type={f.type ?? "text"}
            inputMode={f.type === "url" ? "url" : undefined}
            placeholder={f.placeholder}
            autoComplete={f.type === "password" ? "new-password" : "off"}
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </PField>
      ))}
      <p className="text-xs text-ink-3">Guardamos estas credenciales de forma privada y solo las usamos para publicar tus artículos.</p>
    </PForm>
  );
}
