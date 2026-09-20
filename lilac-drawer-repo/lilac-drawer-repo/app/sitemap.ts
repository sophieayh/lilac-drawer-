import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import {
  getAllPostSlugs,
  getAllProductSlugs,
  getAllCategorySlugs,
  getAllCommunityPostIds,
  getAllUserHandles,
} from "@/db/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [postSlugs, productSlugs, categorySlugs, communityPostIds, userHandles] =
    await Promise.all([
      getAllPostSlugs(),
      getAllProductSlugs(),
      getAllCategorySlugs(),
      getAllCommunityPostIds(),
      getAllUserHandles(),
    ]);

  // Static Core Landing Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${siteConfig.url}/deals`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${siteConfig.url}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${siteConfig.url}/blog/all`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteConfig.url}/blog/care`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.url}/blog/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.url}/blog/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.url}/deals/today-deals`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteConfig.url}/deals/best-sellers`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteConfig.url}/deals/new-arrivals`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteConfig.url}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteConfig.url}/community`, lastModified: now, changeFrequency: "hourly", priority: 0.75 },
    { url: `${siteConfig.url}/search`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  // Dynamic Categories (/category/[slug])
  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${siteConfig.url}/category/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  // Dynamic Product Deals (/deals/[slug])
  const productRoutes: MetadataRoute.Sitemap = productSlugs.map((p) => ({
    url: `${siteConfig.url}/deals/${p.slug}`,
    lastModified: p.updatedAt || now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Dynamic Blog Posts (/blog/[slug])
  const postRoutes: MetadataRoute.Sitemap = postSlugs.map((p) => ({
    url: `${siteConfig.url}/blog/${p.slug}`,
    lastModified: p.updatedAt || p.publishedAt || now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic Community Posts (/community/post/[id])
  const communityRoutes: MetadataRoute.Sitemap = communityPostIds.map((p) => ({
    url: `${siteConfig.url}/community/post/${p.id}`,
    lastModified: p.postedAt || now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic Public Profiles (/community/[handle])
  const profileRoutes: MetadataRoute.Sitemap = userHandles.map((u) => ({
    url: `${siteConfig.url}/community/${u.handle}`,
    lastModified: u.createdAt || now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...postRoutes,
    ...communityRoutes,
    ...profileRoutes,
  ];
}
