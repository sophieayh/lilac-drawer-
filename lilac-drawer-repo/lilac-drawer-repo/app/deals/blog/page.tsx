import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import DealsBlogExplorer from "@/components/DealsBlogExplorer";
import { getAllDealsBlogPosts } from "@/db/queries";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";

export const revalidate = 60;

const title = "Deal Guides & Reviews — Tested Recommendations";
const description =
  "Browse expert reviews, buying guides, and tested routines with live discount breakdowns and store comparisons on Lilac Drawer.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  path: "/deals/blog",
});

export default async function DealsBlogPage() {
  const posts = await getAllDealsBlogPosts();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Deal Guides & Reviews",
          description,
          url: absoluteUrl("/deals/blog"),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Deals", item: absoluteUrl("/deals") },
            { "@type": "ListItem", position: 3, name: "Deal Guides & Blog", item: absoluteUrl("/deals/blog") },
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-8 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <DealsBlogExplorer initialPosts={posts} />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
