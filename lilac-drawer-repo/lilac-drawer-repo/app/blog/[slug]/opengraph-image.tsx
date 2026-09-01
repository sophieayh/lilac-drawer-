import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/db/queries";
import { siteConfig } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const title = post?.title ?? siteConfig.name;
  const label = post?.topicLabel ?? post?.category ?? siteConfig.tagline;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(150deg, #f6eff8 0%, #f9d6e4 60%, #f3c6d6 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#c9a13c",
            marginBottom: 24,
            display: "flex",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 56,
            lineHeight: 1.2,
            color: "#7a5a8c",
            fontWeight: 700,
            display: "flex",
            maxWidth: 980,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 24, color: "#d4708f", marginTop: 40, display: "flex" }}>
          Lilac Drawer
        </div>
      </div>
    ),
    { ...size },
  );
}
