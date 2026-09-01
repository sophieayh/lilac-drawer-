import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(150deg, #f6eff8 0%, #f9d6e4 60%, #f3c6d6 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 96,
            color: "#7a5a8c",
            fontWeight: 700,
            display: "flex",
          }}
        >
          Lilac <span style={{ color: "#d4708f", marginLeft: 20 }}>Drawer</span>
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#c9a13c",
            display: "flex",
          }}
        >
          {siteConfig.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
