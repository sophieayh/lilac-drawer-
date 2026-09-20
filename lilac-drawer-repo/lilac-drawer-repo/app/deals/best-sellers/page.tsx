import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import DealsProductExplorer from "@/components/DealsProductExplorer";
import { getAllBestSellers } from "@/db/queries";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";

export const revalidate = 60;

const title = "Best Sellers — Top-Ranked Deals & Most Popular Picks";
const description =
  "Browse Lilac Drawer's best-selling products and top-ranked recommendations with verified discounts and editor testing verdicts.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  path: "/deals/best-sellers",
});

export default async function BestSellersPage() {
  const bestSellers = await getAllBestSellers();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Best Sellers",
          description,
          url: absoluteUrl("/deals/best-sellers"),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Deals", item: absoluteUrl("/deals") },
            { "@type": "ListItem", position: 3, name: "Best Sellers", item: absoluteUrl("/deals/best-sellers") },
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-6 sm:py-8 px-4 sm:px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <DealsProductExplorer
            title="Best Sellers"
            subtitle="Our highest-rated, reader-favorite beauty and wardrobe picks ranked by authentic performance and verified savings."
            badge="Top Rated & Reader Favorites"
            collectionType="best-sellers"
            initialProducts={bestSellers}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
