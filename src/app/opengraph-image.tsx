import { ImageResponse } from "next/og";

export const alt = "Kalkulator wyceny strony www — sprawdź cenę w 60 sekund";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f4f1e8",
          backgroundImage:
            "linear-gradient(to right, rgba(30,41,54,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,41,54,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          color: "#1e2936",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#5b6672",
          }}
        >
          <div
            style={{
              backgroundColor: "#1e2936",
              color: "#fffdf6",
              padding: "4px 12px",
              fontWeight: 700,
            }}
          >
            PK
          </div>
          Pracownia Kreska · Kosztorys wstępny
        </div>

        <div
          style={{
            marginTop: 70,
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Ile kosztuje</span>
          <span>Twoja strona www?</span>
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 34,
            color: "#5b6672",
            display: "flex",
          }}
        >
          6 pytań · kosztorys na żywo · widełki cen
        </div>

        <div
          style={{
            position: "absolute",
            right: 80,
            top: 80,
            border: "6px solid #e4571b",
            color: "#e4571b",
            padding: "14px 28px",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            transform: "rotate(-8deg)",
            display: "flex",
          }}
        >
          Wycena w 60 s
        </div>

        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 64,
            display: "flex",
            alignItems: "baseline",
            gap: 18,
            fontSize: 40,
            fontWeight: 700,
            color: "#b94312",
          }}
        >
          od 990 zł
          <span style={{ fontSize: 28, color: "#5b6672", fontWeight: 400 }}>
            — sprawdź swój przedział
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
