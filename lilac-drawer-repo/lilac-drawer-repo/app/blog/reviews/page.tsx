import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import BlogArticleExplorer from "@/components/BlogArticleExplorer";
import { getCategoryOrAllPosts, getAllPublishedPosts } from "@/db/queries";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";

export const revalidate = 60;

const title = "Product Reviews — Tested & Honest Verdicts";
const description =
  "Read in-depth, hands-on product reviews and honest testing breakdowns on beauty, wardrobe care, and lifestyle essentials by Lilac Drawer editors.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  path: "/blog/reviews",
});

export default async function BlogReviewsPage() {
  const [reviews, allPosts] = await Promise.all([
    getCategoryOrAllPosts("REVIEWS", 100),
    getAllPublishedPosts(100),
  ]);

  const posts = reviews.length > 0 ? reviews : allPosts;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Product Reviews",
          description,
          url: absoluteUrl("/blog/reviews"),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
            { "@type": "ListItem", position: 3, name: "Reviews", item: absoluteUrl("/blog/reviews") },
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-8 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <BlogArticleExplorer
            title="Tested Product Reviews"
            subtitle="Honest, multi-week testing reviews of beauty essentials, clothing steamers, and wardrobe organizers with verified pros, cons, and performance scores."
            badge="Hands-On Tested Reviews"
            collectionType="reviews"
            initialPosts={posts}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
