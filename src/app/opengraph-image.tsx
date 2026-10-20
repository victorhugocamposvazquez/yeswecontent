import { ImageResponse } from "next/og";

export const alt = "yeswecontent · Tráfico orgánico desde Google y la IA, en piloto automático";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#121212";
const INK2 = "#4b4b48";
const SIGNAL = "#ff4f1f";
const LINE = "#e7e6e2";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          backgroundImage:
            "radial-gradient(60% 50% at 50% 0%, rgba(255,79,31,0.12), transparent 70%), radial-gradient(40% 40% at 90% 30%, rgba(212,245,90,0.35), transparent 70%), radial-gradient(40% 40% at 5% 40%, rgba(159,211,255,0.3), transparent 70%)",
          padding: 64,
          fontFamily: "Arial, sans-serif",
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", position: "relative", width: 64, height: 52 }}>
            <svg width="64" height="52" viewBox="0 0 40 32">
              <path d="M4 2h32a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H16l-8 6v-6H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill={SIGNAL} stroke={INK} strokeWidth="2" />
            </svg>
            <div style={{ position: "absolute", top: 0, left: 0, width: 64, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, letterSpacing: -0.4, fontWeight: 800 }}>
              yes<span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: 24 }}>!</span>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
            yeswe<span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: 42 }}>content!</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, fontWeight: 700, color: SIGNAL }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: SIGNAL }} />
            SEO + GEO · en piloto automático
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 72, lineHeight: 1.04, letterSpacing: -2.5, fontWeight: 700, maxWidth: 1040 }}>
            <span>Automatiza que te encuentren cuando buscan en&nbsp;</span>
            <span style={{ color: SIGNAL }}>Google y la IA.</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {["Google", "ChatGPT", "Gemini", "Perplexity", "Claude"].map((m) => (
              <span key={m} style={{ display: "flex", border: `1px solid ${LINE}`, background: "#fff", borderRadius: 999, padding: "8px 18px", color: INK2, fontSize: 20, fontWeight: 600 }}>
                {m}
              </span>
            ))}
          </div>
          <span style={{ display: "flex", background: SIGNAL, color: "#fff", borderRadius: 12, padding: "14px 28px", fontWeight: 700 }}>Prueba 3 días gratis</span>
        </div>
      </div>
    ),
    size,
  );
}
