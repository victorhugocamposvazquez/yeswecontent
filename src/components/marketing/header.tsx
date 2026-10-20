"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ProductIcon } from "@/lib/marketing/products";
import { ProductGlyph } from "./primitives";

export interface ProductNavItem {
  slug: string;
  name: string;
  short: string;
  icon: ProductIcon;
}

const links = [
  { href: "/herramientas", label: "Herramientas gratis" },
  { href: "/precios", label: "Precios" },
  { href: "/casos", label: "Casos" },
  { href: "/agencias", label: "Agencias" },
];

export function MarketingHeader({ products }: { products: ProductNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // menú móvil
  const [dropdown, setDropdown] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setDropdown(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdown(false);
        setOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdown(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="yeswecontent, inicio" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          <div ref={dropRef} className="relative" onMouseLeave={() => setDropdown(false)}>
            <button
              type="button"
              aria-expanded={dropdown}
              aria-haspopup="true"
              onClick={() => setDropdown((v) => !v)}
              onMouseEnter={() => setDropdown(true)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-paper-2",
                (dropdown || active("/producto")) && "bg-paper-2",
              )}
            >
              Producto <ChevronDown className={cn("h-4 w-4 transition-transform", dropdown && "rotate-180")} aria-hidden />
            </button>
            {dropdown && (
              <div className="absolute left-1/2 top-full w-[min(44rem,90vw)] -translate-x-1/2 pt-3">
                <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-card p-3 shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)]">
                  {products.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/producto/${p.slug}`}
                      className="group flex items-start gap-3 rounded-xl p-3 hover:bg-paper"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-paper group-hover:bg-lime">
                        <ProductGlyph icon={p.icon} className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{p.name}</span>
                        <span className="block text-xs text-ink-3">{p.short}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-paper-2", active(l.href) && "bg-paper-2")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/entrar" className="hidden rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-paper-2 sm:inline-flex">
            Entrar
          </Link>
          <Link
            href="/registro"
            className="hidden rounded-lg border border-line bg-signal px-4 py-2 text-sm font-semibold text-signal-ink shadow-sm transition hover:shadow-md sm:inline-flex"
          >
            Prueba gratis
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-card lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-t border-line bg-paper lg:hidden">
          <nav aria-label="Móvil" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">Producto</p>
            <div className="mt-3 grid gap-1 sm:grid-cols-2">
              {products.map((p) => (
                <Link key={p.slug} href={`/producto/${p.slug}`} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-paper-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-card">
                    <ProductGlyph icon={p.icon} className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">{p.name}</span>
                </Link>
              ))}
            </div>
            <div className="mt-6 divide-y divide-line border-y border-line">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center justify-between py-4 font-display text-3xl">
                  {l.label} <span aria-hidden>→</span>
                </Link>
              ))}
            </div>
            <div className="mt-8 grid gap-3">
              <Link
                href="/registro"
                className="rounded-lg border border-line bg-signal px-5 py-3 text-center font-semibold text-signal-ink shadow-sm"
              >
                Prueba gratis 3 días
              </Link>
              <Link href="/entrar" className="rounded-lg border border-line bg-card px-5 py-3 text-center font-semibold">
                Entrar
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
