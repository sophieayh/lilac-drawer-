import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getAllPostSlugs, getAllCommunityPostIds, getAllUserHandles } from "@/db/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [postSlugs, communityPostIds, userHandles] = await Promise.all([
    getAllPostSlugs(),
    getAllCommunityPostIds(),
    getAllUserHandles(),
  ]);

  return [
    { url: `${siteConfig.url}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/deals`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    // Note: /community itself is intentionally excluded — it's marked
    // noindex (it just re-lists posts that already have their own
    // indexable URL below), so listing it here would contradict that.
    ...postSlugs.map((p) => ({
      url: `${siteConfig.url}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...communityPostIds.map((p) => ({
      url: `${siteConfig.url}/community/post/${p.id}`,
      lastModified: p.postedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...userHandles.map((u) => ({
      url: `${siteConfig.url}/community/${u.handle}`,
      lastModified: u.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
