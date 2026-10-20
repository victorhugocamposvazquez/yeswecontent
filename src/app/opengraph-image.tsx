import { ImageResponse } from "next/og";

export const alt = "yeswecontent · Tráfico orgánico desde Google y la IA, en piloto automático";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          padding: 64,
          fontFamily: "Arial, sans-serif",
          color: "#15130f",
          backgroundImage: "radial-gradient(rgba(21,19,15,0.08) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="84" height="68" viewBox="0 0 40 32">
            <path d="M4 2h32a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H16l-8 6v-6H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill="#ff4f1f" stroke="#15130f" strokeWidth="2" />
          </svg>
          <div style={{ display: "flex", fontSize: 44, fontFamily: "Arial, sans-serif", fontWeight: 700, letterSpacing: -1 }}>
            yeswe<span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>content</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 76, lineHeight: 1.05, letterSpacing: -2, fontWeight: 700, maxWidth: 1000 }}>
            <span>Automatiza que te encuentren cuando buscan en&nbsp;</span>
            <span style={{ color: "#ff4f1f" }}>Google y la IA.</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "Arial, sans-serif", fontSize: 24 }}>
          <span style={{ letterSpacing: 4, textTransform: "uppercase", color: "#4a453c" }}>SEO + GEO en piloto automático</span>
          <span style={{ background: "#ff4f1f", color: "#fff", borderRadius: 12, padding: "12px 28px", fontWeight: 700, boxShadow: "none" }}>
            Prueba 3 días gratis
          </span>
        </div>
      </div>
    ),
    size,
  );
}
