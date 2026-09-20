import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import DealsProductExplorer from "@/components/DealsProductExplorer";
import { getAllNewArrivals } from "@/db/queries";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";

export const revalidate = 60;

const title = "New Arrivals — Fresh Tested Products & Trending Deals";
const description =
  "Discover the newest tested beauty, skincare, and wardrobe essentials recently added to Lilac Drawer with authentic reviews and deals.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  path: "/deals/new-arrivals",
});

export default async function NewArrivalsPage() {
  const newArrivals = await getAllNewArrivals();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "New Arrivals",
          description,
          url: absoluteUrl("/deals/new-arrivals"),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Deals", item: absoluteUrl("/deals") },
            { "@type": "ListItem", position: 3, name: "New Arrivals", item: absoluteUrl("/deals/new-arrivals") },
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-6 sm:py-8 px-4 sm:px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <DealsProductExplorer
            title="New Arrivals"
            subtitle="Explore our freshest additions and newly tested beauty & lifestyle essentials with live multi-store discount tracking."
            badge="Fresh Trends & New Releases"
            collectionType="new-arrivals"
            initialProducts={newArrivals}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
