import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import BlogArticleExplorer from "@/components/BlogArticleExplorer";
import { getAllPublishedPosts } from "@/db/queries";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";

export const revalidate = 60;

const title = "All Blog Articles — Reviews, Guides & Tips Archive";
const description =
  "Explore all published articles, tested reviews, clothing care routines, and shopping guides from the Lilac Drawer editorial team.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  path: "/blog/all",
});

export default async function BlogAllArticlesPage() {
  const posts = await getAllPublishedPosts(100);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "All Blog Articles",
          description,
          url: absoluteUrl("/blog/all"),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
            { "@type": "ListItem", position: 3, name: "All Articles", item: absoluteUrl("/blog/all") },
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-6 sm:py-8 px-4 sm:px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <BlogArticleExplorer
            title="All Articles & Buying Guides"
            subtitle="Browse our full library of tested reviews, care tips, and curated shopping recommendations with instant search and topic filters."
            badge="Full Editorial Archive"
            collectionType="all"
            initialPosts={posts}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
