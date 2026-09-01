import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/explore",
          // "$" anchors this to the bare feed URL only — without it, this
          // would block every /community/* sub-path too, including the
          // indexable /community/post/[id] and /community/[handle] pages
          // that are the whole point of the community section being
          // crawlable in the first place.
          "/community$",
          "/profile",
          "/fashion-collage",
          "/login",
          "/signup",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
