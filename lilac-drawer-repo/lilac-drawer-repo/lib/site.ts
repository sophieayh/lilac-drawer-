export const siteConfig = {
  name: "Lilac Drawer",
  shortName: "Lilac Drawer",
  tagline: "Honest Reviews & Buying Guides",
  description:
    "Reader-supported reviews and buying guides for clothing care, accessories, wardrobe storage, and jewelry — tested by hand, ranked honestly, updated often.",
  // TODO: replace with the real production domain before deploying.
  url: "https://www.lilacdrawer.com",
  locale: "en_US",
  founder: "Lilac Drawer Editorial Team",
  twitter: "@lilacdrawer",
  keywords: [
    "clothing care reviews",
    "affiliate shopping guide",
    "garment steamer reviews",
    "wardrobe storage guide",
    "jewelry box reviews",
    "buying guides",
    "product reviews blog",
  ],
} as const;

export function absoluteUrl(path: string) {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

import type { Metadata } from "next";

/**
 * Builds a complete, consistent Metadata object for a page — every page must
 * repeat the full openGraph/twitter block (Next.js replaces, not deep-merges,
 * nested metadata objects between layout and page), so this keeps og:type,
 * og:site_name, og:locale and the OG image consistent everywhere.
 */
export function buildMetadata({
  title,
  description,
  path,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
}): Metadata {
  const url = path;
  // Article and profile pages generate their own per-page OG image via a
  // co-located opengraph-image.tsx file — Next.js's file-convention image
  // only applies when metadata doesn't explicitly set `images`, so we omit
  // it here and let that file take over automatically.
  const hasOwnOgImage = type === "article" || type === "profile";
  const ogImage = hasOwnOgImage
    ? undefined
    : [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — ${siteConfig.tagline}`,
        },
      ];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      // OpenGraph doesn't have a "profile" type in Next.js's Metadata
      // union — "website" is the correct fallback for a person page.
      type: type === "profile" ? "website" : type,
      url,
      title,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitter,
      creator: siteConfig.twitter,
      title,
      description,
      images: hasOwnOgImage ? undefined : ["/opengraph-image"],
    },
  };
}
