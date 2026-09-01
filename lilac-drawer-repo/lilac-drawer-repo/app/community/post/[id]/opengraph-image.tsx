import { ImageResponse } from "next/og";
import { getPostById } from "@/db/queries";
import { siteConfig } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(Number(id));
  const original = post?.repostOfId ? await getPostById(post.repostOfId) : null;
  const isBareRepost = !!original && !post?.body.trim();

  const bodyText = isBareRepost ? original!.body : post?.body ?? "";
  const authorName = post?.authorName ?? siteConfig.name;
  const authorHandle = post?.authorHandle ?? "";

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
        <div style={{ fontSize: 26, color: "#c9a13c", marginBottom: 24, display: "flex" }}>
          {isBareRepost ? `↻ ${authorName} reposted` : `@${authorHandle}`}
        </div>
        <div
          style={{
            fontSize: 44,
            lineHeight: 1.35,
            color: "#7a5a8c",
            fontWeight: 700,
            display: "flex",
            maxWidth: 980,
          }}
        >
          {bodyText.slice(0, 180)}
        </div>
        <div style={{ fontSize: 24, color: "#d4708f", marginTop: 40, display: "flex" }}>
          {siteConfig.name}
        </div>
      </div>
    ),
    { ...size },
  );
}
