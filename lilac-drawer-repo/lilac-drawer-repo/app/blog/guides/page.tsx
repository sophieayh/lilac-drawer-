import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import BlogArticleExplorer from "@/components/BlogArticleExplorer";
import { getCategoryOrAllPosts, getAllPublishedPosts } from "@/db/queries";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";

export const revalidate = 60;

const title = "Buying Guides — Expert Testing & Recommendations";
const description =
  "Comprehensive buyer guides comparing features, testing results, and prices for beauty, wardrobe, and home essentials by Lilac Drawer.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  path: "/blog/guides",
});

export default async function BlogGuidesPage() {
  const [guides, allPosts] = await Promise.all([
    getCategoryOrAllPosts("GUIDES", 100),
    getAllPublishedPosts(100),
  ]);

  const posts = guides.length > 0 ? guides : allPosts;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Expert Buying Guides",
          description,
          url: absoluteUrl("/blog/guides"),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
            { "@type": "ListItem", position: 3, name: "Buying Guides", item: absoluteUrl("/blog/guides") },
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-8 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <BlogArticleExplorer
            title="Expert Buying Guides"
            subtitle="Curated roundups, head-to-head comparisons, and buyer advice to help you invest in the right pieces with confidence."
            badge="Curated Buying Advice"
            collectionType="guides"
            initialPosts={posts}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
