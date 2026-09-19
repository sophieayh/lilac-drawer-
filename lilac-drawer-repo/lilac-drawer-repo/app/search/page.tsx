import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import SearchClient from "./SearchClient";
import { getAllProductsForSearch, getAllPostsForSearch, getHeaderCategories } from "@/db/queries";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";

export const revalidate = 60;

interface Props {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q ? `Search: "${q}" — ${siteConfig.name}` : `Search Products & Articles — ${siteConfig.name}`;
  const description = `Search honest editor reviews, tested lifestyle picks, buying guides, and live deals on ${siteConfig.name}.`;

  return buildMetadata({
    title,
    description,
    path: "/search",
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialQuery = params.q || "";
  const initialType = params.type || "all";
  const initialCategory = params.category || "all";
  const initialSort = params.sort || "relevance";

  const [allProducts, allPosts, categoriesData] = await Promise.all([
    getAllProductsForSearch(),
    getAllPostsForSearch(),
    getHeaderCategories(),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          name: "Search Lilac Drawer",
          description: "Search reviews, buying guides, and verified deals.",
          url: absoluteUrl("/search"),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Search", item: absoluteUrl("/search") },
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-8 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <SearchClient
            initialQuery={initialQuery}
            initialType={initialType}
            initialCategory={initialCategory}
            initialSort={initialSort}
            allProducts={allProducts}
            allPosts={allPosts}
            siteCategories={categoriesData}
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
