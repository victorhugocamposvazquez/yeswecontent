import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { products } from "@/lib/marketing/products";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const nav = products.map(({ slug, name, short, icon }) => ({ slug, name, short, icon }));
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Saltar al contenido
      </a>
      <MarketingHeader products={nav} />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
