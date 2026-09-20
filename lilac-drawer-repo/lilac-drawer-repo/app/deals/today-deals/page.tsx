import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import DealsProductExplorer from "@/components/DealsProductExplorer";
import { getAllTodayDeals, getAllDealsProducts } from "@/db/queries";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";

export const revalidate = 60;

const title = "Today's Deals — Verified Daily Beauty & Lifestyle Discounts";
const description =
  "Explore today's verified deals with authentic discounts, multi-store price comparisons, and tested editor ratings on Lilac Drawer.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  path: "/deals/today-deals",
});

export default async function TodayDealsPage() {
  const [todayDeals, allDeals] = await Promise.all([
    getAllTodayDeals(),
    getAllDealsProducts(),
  ]);

  // Combine today deals with all discounted deals if needed to ensure a rich catalog
  const dealsMap = new Map<number, (typeof todayDeals)[0]>();
  for (const item of todayDeals) {
    dealsMap.set(item.id, item);
  }
  for (const item of allDeals) {
    if (!dealsMap.has(item.id)) {
      dealsMap.set(item.id, item);
    }
  }

  const products = Array.from(dealsMap.values());

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Today's Deals",
          description,
          url: absoluteUrl("/deals/today-deals"),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Deals", item: absoluteUrl("/deals") },
            { "@type": "ListItem", position: 3, name: "Today's Deals", item: absoluteUrl("/deals/today-deals") },
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-6 sm:py-8 px-4 sm:px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <DealsProductExplorer
            title="Today's Deals"
            subtitle="Verified daily discounts with tested quality ratings, real savings calculations, and live multi-retailer pricing."
            badge="Verified Daily Savings"
            collectionType="today-deals"
            initialProducts={products}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
