import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import BlogArticleExplorer from "@/components/BlogArticleExplorer";
import { getCategoryOrAllPosts, getAllPublishedPosts } from "@/db/queries";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";

export const revalidate = 60;

const title = "Clothing & Fabric Care — Cleaning & Maintenance Guides";
const description =
  "Expert clothing care guides, garment steaming routines, fabric preservation tips, and wardrobe maintenance advice by Lilac Drawer.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  path: "/blog/care",
});

export default async function BlogCarePage() {
  const [carePosts, allPosts] = await Promise.all([
    getCategoryOrAllPosts("CARE", 100),
    getAllPublishedPosts(100),
  ]);

  const posts = carePosts.length > 0 ? carePosts : allPosts;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Clothing & Fabric Care Guides",
          description,
          url: absoluteUrl("/blog/care"),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
            { "@type": "ListItem", position: 3, name: "Care Guides", item: absoluteUrl("/blog/care") },
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-8 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <BlogArticleExplorer
            title="Clothing & Fabric Care Guides"
            subtitle="Step-by-step routines, steaming methods, and stain-removal advice to protect your wardrobe and prolong the life of your favorite garments."
            badge="Fabric & Garment Care"
            collectionType="care"
            initialPosts={posts}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
