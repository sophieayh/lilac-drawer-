export const siteConfig = {
  name: "Lilac Drawer",
  shortName: "Lilac Drawer",
  tagline: "Honest Reviews, Care Guides & Verified Deals",
  description:
    "Reader-supported reviews, tested care routines, and curated buying guides for clothing care, wardrobe storage, beauty, and accessories — tested by hand, ranked honestly, updated often.",
  url: "https://www.lilacdrawer.com",
  locale: "en_US",
  founder: "Lilac Drawer Editorial Team",
  twitter: "@lilacdrawer",
  sameAs: [
    "https://twitter.com/lilacdrawer",
    "https://instagram.com/lilacdrawer",
    "https://pinterest.com/lilacdrawer",
  ],
  keywords: [
    "clothing care reviews",
    "garment steamer reviews",
    "wardrobe storage ideas",
    "jewelry organization",
    "beauty product reviews",
    "makeup buying guides",
    "tested lifestyle picks",
    "authentic deals and discounts",
    "curated shopping guide",
    "fabric care tips",
    "Lilac Drawer",
    "خزانة ليلك",
    "دليل العناية بالملابس",
    "مراجعات منتجات الجمال",
    "عروض وتخفيضات موثوقة",
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
  imageUrl,
  imageAlt,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  imageUrl?: string | null;
  imageAlt?: string | null;
  noIndex?: boolean;
}): Metadata {
  const url = path.startsWith("http") ? path : absoluteUrl(path);

  // Determine OG image
  let ogImages: { url: string; width: number; height: number; alt: string }[] | undefined;
  let twitterImages: string[] | undefined;

  if (imageUrl) {
    const fullImgUrl = imageUrl.startsWith("http") ? imageUrl : absoluteUrl(imageUrl);
    ogImages = [
      {
        url: fullImgUrl,
        width: 1200,
        height: 630,
        alt: imageAlt || title,
      },
    ];
    twitterImages = [fullImgUrl];
  } else if (type === "website") {
    ogImages = [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ];
    twitterImages = [absoluteUrl("/opengraph-image")];
  }

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: type === "profile" ? "website" : type,
      url,
      title,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitter,
      creator: siteConfig.twitter,
      title,
      description,
      images: twitterImages,
    },
    robots: noIndex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}
