import Link from "next/link";
import { siteConfig } from "@/lib/site";

const footerLinks = [
  { label: "Buying Guides", href: "/blog" },
  { label: "Top Picks", href: "/deals" },
  { label: "Blog", href: "/blog" },
  { label: "Explore", href: "/explore" },
  { label: "Community", href: "/community" },
  { label: "Profile", href: "/profile" },
  { label: "Fashion Collage", href: "/fashion-collage" },
  { label: "About", href: "/#about" },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-purple-deep text-lilac/80 px-6 md:px-12 pt-11 pb-6">
      <div className="flex flex-wrap justify-between gap-7 max-w-[1400px] mx-auto">
        <div className="font-heading text-[22px] font-bold text-cream-alt">
          Lilac <span className="text-lilac">Drawer</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-9 text-sm">
          {footerLinks.map((item) => (
            <Link key={item.label} href={item.href} className="text-lilac/80 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="max-w-[1400px] mx-auto mt-7 pt-4.5 border-t border-white/10 text-xs text-lilac/60">
        As an affiliate, we earn from qualifying purchases. © {year} {siteConfig.name}.
      </div>
    </footer>
  );
}
