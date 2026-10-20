import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const body = Inter_Tight({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "yeswecontent · Contenido que te encuentra clientes, en Google y en la IA",
    template: "%s · yeswecontent",
  },
  description:
    "yeswecontent planifica, escribe y publica el contenido de tu web, consigue enlaces y vigila si ChatGPT, Claude o Gemini te recomiendan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${serif.variable} ${body.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
