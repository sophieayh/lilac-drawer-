import { ImageResponse } from "next/og";
import { getUserByHandle } from "@/db/queries";
import { siteConfig } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const person = await getUserByHandle(handle);

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
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "linear-gradient(150deg, #d4a5d8, #c9a3c6)",
            marginBottom: 32,
            display: "flex",
          }}
        />
        <div style={{ fontSize: 56, color: "#7a5a8c", fontWeight: 700, display: "flex" }}>
          {person?.name ?? siteConfig.name}
        </div>
        <div style={{ fontSize: 28, color: "#c9a13c", marginTop: 16, display: "flex" }}>
          @{person?.handle ?? "lilacdrawer"} · {siteConfig.name}
        </div>
      </div>
    ),
    { ...size },
  );
}
