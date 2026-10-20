"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { ButtonLink, Card, Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ProductIcon } from "@/lib/marketing/products";
import { IconBox, ProductGlyph } from "./primitives";

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

const navItem = "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-ink-2 transition-colors duration-150 hover:bg-paper-2 hover:text-ink";

export function MarketingHeader({ products }: { products: ProductNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // menú móvil
  const [dropdown, setDropdown] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

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
  const close = () => setOpen(false);
  const enter = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setDropdown(true);
  };
  const leave = () => {
    closeTimer.current = window.setTimeout(() => setDropdown(false), 120);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-md supports-[backdrop-filter]:bg-paper/75">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="yeswecontent, inicio" className="shrink-0 rounded-md">
            <Logo />
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-0.5 lg:flex">
            <div ref={dropRef} className="relative" onMouseEnter={enter} onMouseLeave={leave}>
              <button
                type="button"
                aria-expanded={dropdown}
                aria-haspopup="true"
                onClick={() => setDropdown((v) => !v)}
                className={cn(navItem, (dropdown || active("/producto")) && "bg-paper-2 text-ink")}
              >
                Producto <ChevronDown className={cn("h-4 w-4 text-ink-3 transition-transform duration-150", dropdown && "rotate-180")} aria-hidden />
              </button>
              {dropdown && (
                <div className="absolute left-1/2 top-full w-[min(46rem,calc(100vw-2rem))] -translate-x-1/2 pt-2">
                  <Card elevated className="overflow-hidden p-2">
                    <div className="grid grid-cols-2 gap-0.5">
                      {products.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/producto/${p.slug}`}
                          className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors duration-150 hover:bg-paper-2"
                        >
                          <IconBox>
                            <ProductGlyph icon={p.icon} />
                          </IconBox>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold tracking-tight">{p.name}</span>
                            <span className="block truncate text-[13px] text-ink-3">{p.short}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-paper-2 px-4 py-2.5 text-[13px]">
                      <span className="text-ink-2">¿No sabes por dónde empezar? Prueba el agente completo.</span>
                      <Link href="/producto/agente-seo" className="inline-flex items-center gap-1 font-semibold text-signal">
                        Ver agente SEO <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </Card>
                </div>
              )}
            </div>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cn(navItem, active(l.href) && "bg-paper-2 text-ink")}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/entrar" className={cn(navItem, "max-sm:hidden")}>
              Entrar
            </Link>
            <ButtonLink href="/registro" size="sm" className="max-sm:hidden">
              Prueba gratis
            </ButtonLink>
            <button
              type="button"
              className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink transition-colors duration-150 hover:bg-paper-2 lg:hidden"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              aria-controls="menu-movil"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Fuera del <header>: su backdrop-filter crearía un bloque contenedor para el position:fixed. */}
      {open && (
        <div id="menu-movil" className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto overscroll-contain border-t border-line bg-paper lg:hidden">
          <nav aria-label="Móvil" className="mx-auto max-w-[1200px] px-4 pt-5 sm:px-6">
            <p className="eyebrow">Producto</p>
            <div className="mt-3 grid grid-cols-1 gap-0.5 sm:grid-cols-2">
              {products.map((p) => (
                <Link key={p.slug} href={`/producto/${p.slug}`} onClick={close} className="-mx-2 flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5 active:bg-paper-2">
                  <IconBox>
                    <ProductGlyph icon={p.icon} />
                  </IconBox>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold tracking-tight">{p.name}</span>
                    <span className="block truncate text-[13px] text-ink-3">{p.short}</span>
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-5 divide-y divide-line border-y border-line">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={close} aria-current={active(l.href) ? "page" : undefined} className="flex min-h-14 items-center justify-between text-lg font-semibold tracking-tight">
                  {l.label} <ArrowRight className="h-4 w-4 text-ink-3" aria-hidden />
                </Link>
              ))}
            </div>
            <div className="sticky bottom-0 -mx-4 mt-5 grid grid-cols-[1fr_1.6fr] gap-3 border-t border-line bg-paper px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:-mx-6 sm:px-6">
              <ButtonLink href="/entrar" variant="outline" size="lg" onClick={close}>
                Entrar
              </ButtonLink>
              <ButtonLink href="/registro" size="lg" onClick={close}>
                Prueba gratis 3 días
              </ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
