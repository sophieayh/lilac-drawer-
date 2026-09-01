import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream text-purple-deep min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="font-heading text-5xl mb-4 text-purple-deep">404</h1>
        <p className="text-tan-dark mb-6">We couldn&apos;t find that page.</p>
        <Link href="/" className="bg-lilac text-white px-6 py-3 rounded-full font-semibold text-sm">
          Back to Home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
