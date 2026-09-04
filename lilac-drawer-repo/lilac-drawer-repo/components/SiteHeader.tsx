"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { slugify } from "@/lib/slugify";
import type { SubCategoryItem } from "@/db/schema";

interface CategoryNavData {
  id?: number;
  label: string;
  slug?: string | null;
  icon?: string | null;
  colorHex?: string | null;
  href?: string | null;
  subcategories?: SubCategoryItem[] | null;
}

const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Deals", href: "/deals" },
  { label: "Blog", href: "/blog" },
  { label: "Explore", href: "/explore" },
  { label: "Community", href: "/community" },
  { label: "Collage", href: "/fashion-collage" },
];

const fallbackCategories: CategoryNavData[] = [
  {
    label: "Beauty & Makeup",
    slug: "beauty-makeup",
    icon: null,
    colorHex: "#f3c6d6",
    href: "/blog",
    subcategories: [
      {
        id: "sub-1-1",
        label: "Makeup Essentials",
        href: "/blog/best-everyday-makeup-essentials",
        description: "Foundations, blushes & setting sprays tested for all-day wear",
      },
      {
        id: "sub-1-2",
        label: "Skincare & Serums",
        href: "/deals",
        description: "Hydrating hyaluronic serums, SPF & nourishing creams",
      },
      {
        id: "sub-1-3",
        label: "Haircare & Styling",
        href: "/deals",
        description: "Ionic dryers, silk heatless curlers & repair oils",
      },
      {
        id: "sub-1-4",
        label: "Fragrance & Body",
        href: "/deals",
        description: "Clean luxury scents & ultra-moisturizing body butters",
      },
    ],
  },
  {
    label: "Clothing Care",
    slug: "clothing-care",
    icon: null,
    colorHex: "#e8f0e4",
    href: "/deals",
    subcategories: [
      {
        id: "sub-2-1",
        label: "Garment Steamers",
        href: "/deals",
        description: "Handheld & standing steamers tested for rapid de-wrinkling",
      },
      {
        id: "sub-2-2",
        label: "Fabric Shavers",
        href: "/deals",
        description: "Rechargeable lint & pill removers for wool and cashmere",
      },
      {
        id: "sub-2-3",
        label: "Wool Dryer Balls",
        href: "/deals",
        description: "Natural New Zealand wool balls to reduce drying time & wrinkles",
      },
      {
        id: "sub-2-4",
        label: "Lint Rollers & Brushes",
        href: "/deals",
        description: "Reusable sticky rollers & natural bristle clothes brushes",
      },
    ],
  },
  {
    label: "Wardrobe Storage",
    slug: "wardrobe-storage",
    icon: null,
    colorHex: "#f6eff8",
    href: "/deals",
    subcategories: [
      {
        id: "sub-3-1",
        label: "Closet Organizers",
        href: "/deals",
        description: "Honeycomb drawer dividers, shelf risers & modular bins",
      },
      {
        id: "sub-3-2",
        label: "Cedar Blocks & Rings",
        href: "/deals",
        description: "100% natural red cedar moth defense and closet freshener",
      },
      {
        id: "sub-3-3",
        label: "Velvet & Wooden Hangers",
        href: "/deals",
        description: "Slim space-saving velvet hangers & contoured wooden coat hangers",
      },
      {
        id: "sub-3-4",
        label: "Under-Bed Storage",
        href: "/deals",
        description: "Heavy-duty breathable fabric bins with clear view windows",
      },
    ],
  },
  {
    label: "Jewelry & Watches",
    slug: "jewelry-watches",
    icon: null,
    colorHex: "#f3e6d0",
    href: "/deals",
    subcategories: [
      {
        id: "sub-4-1",
        label: "Anti-Tarnish Boxes",
        href: "/deals",
        description: "Velvet-lined lockable jewelry boxes that prevent silver oxidation",
      },
      {
        id: "sub-4-2",
        label: "Travel Organizers",
        href: "/deals",
        description: "Foldable leather jewelry rolls for necklaces, rings & studs",
      },
      {
        id: "sub-4-3",
        label: "Ultrasonic Cleaners",
        href: "/deals",
        description: "Gentle 42,000Hz wave jewelry polishers for rings and diamonds",
      },
      {
        id: "sub-4-4",
        label: "Watch Cases & Winders",
        href: "/deals",
        description: "Automatic watch winders with quiet Japanese motors",
      },
    ],
  },
  {
    label: "Bags & Accessories",
    slug: "bags-accessories",
    icon: null,
    colorHex: "#efe3f2",
    href: "/deals",
    subcategories: [
      {
        id: "sub-5-1",
        label: "Tote Bags & Purses",
        href: "/deals",
        description: "Structured leather totes, nylon work bags & crossbody bags",
      },
      {
        id: "sub-5-2",
        label: "Silk Scarves & Bandanas",
        href: "/deals",
        description: "100% mulberry silk twill square scarves with hand-rolled edges",
      },
      {
        id: "sub-5-3",
        label: "Felt Bag Shapers",
        href: "/deals",
        description: "Custom inserts that keep designer handbags structured and neat",
      },
      {
        id: "sub-5-4",
        label: "Cardholders & Wallets",
        href: "/deals",
        description: "Slim RFID-blocking grained leather wallets and zip pouches",
      },
    ],
  },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryNavData[]>(fallbackCategories);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const res = await fetch("/api/site-categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            setCategories(data);
          }
        }
      } catch (e) {
        // Fallback already in place
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <header className="border-b border-border/60 bg-cream-alt">
        {/* affiliate disclosure bar */}
        <div className="bg-mauve-100 text-tan-dark text-center py-2 px-6 text-[13px]">
          Reader-supported. When you buy through links on our site, we may earn an affiliate
          commission.{" "}
          <Link href="/blog" className="text-gold font-semibold hover:underline">
            Learn more
          </Link>
        </div>

        <div className="flex items-center justify-between gap-8 px-6 md:px-12 py-5 max-w-[1400px] mx-auto">
          <Link
            href="/"
            className="font-heading text-[28px] md:text-[32px] text-lilac tracking-tight shrink-0"
          >
            Lilac <span className="text-gold">Drawer</span>
          </Link>
          <form
            role="search"
            className="flex-1 max-w-[480px] hidden md:flex items-center gap-2.5 bg-mauve-50 rounded-full px-4.5 py-2.5 border border-transparent focus-within:border-lilac/40 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 256 256" fill="#b89a7a" aria-hidden="true">
              <path d="M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z" />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="Show me the best..."
              aria-label="Search the site"
              className="border-none bg-transparent outline-none text-sm flex-1 text-purple-deep placeholder:text-tan-dark/70"
            />
          </form>
          <Link
            href="/profile"
            aria-label="Profile"
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-mauve-50 text-purple-deep hover:bg-mauve-100 transition-colors shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
            </svg>
          </Link>
          <Link
            href="#subscribe"
            className="hidden sm:inline-block bg-lilac text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-[0_2px_8px_rgba(201,163,198,0.35)] hover:bg-lilac/90 transition-colors whitespace-nowrap"
          >
            Subscribe
          </Link>
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-mauve-50 text-purple-deep shrink-0"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile nav Drawer */}
        {menuOpen && (
          <div id="mobile-nav" className="md:hidden border-t border-border bg-mauve-50 px-6 py-4 shadow-lg max-h-[80vh] overflow-y-auto">
            <form role="search" className="flex items-center gap-2.5 bg-white rounded-full px-4.5 py-2.5 mb-4 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 256 256" fill="#b89a7a" aria-hidden="true">
                <path d="M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z" />
              </svg>
              <input
                type="search"
                name="q"
                placeholder="Show me the best..."
                aria-label="Search the site"
                className="border-none bg-transparent outline-none text-sm flex-1 text-purple-deep"
              />
            </form>

            {/* Primary Nav Links */}
            <nav aria-label="Primary" className="flex flex-col gap-1 mb-4">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-purple-deep font-semibold text-sm py-2.5 border-b border-border/60 hover:text-lilac"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="text-purple-deep font-semibold text-sm py-2.5 border-b border-border/60 hover:text-lilac"
              >
                Profile
              </Link>
            </nav>

            {/* Categories Accordion */}
            <div className="pt-2 border-t border-border">
              <div className="text-xs uppercase tracking-wider font-bold text-tan-dark mb-2">
                Categories & Branches
              </div>
              <div className="flex flex-col gap-1.5">
                {categories.map((cat) => {
                  const catSlug = cat.slug || slugify(cat.label);
                  const catHref = `/category/${catSlug}`;
                  const branches = Array.isArray(cat.subcategories) ? cat.subcategories : [];
                  const isExpanded = expandedMobileCategory === cat.label;
                  const hasBranches = branches.length > 0;

                  return (
                    <div key={cat.label} className="border border-border/60 bg-white/70 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between p-2.5">
                        <Link
                          href={catHref}
                          onClick={() => setMenuOpen(false)}
                          className="text-xs font-bold text-purple-deep flex items-center hover:text-lilac"
                        >
                          <span>{cat.label}</span>
                        </Link>

                        {hasBranches && (
                          <button
                            type="button"
                            onClick={() => setExpandedMobileCategory(isExpanded ? null : cat.label)}
                            className="p-1 text-tan-dark hover:text-purple-deep"
                            aria-label={`Toggle ${cat.label} branches`}
                          >
                            <svg
                              className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {hasBranches && isExpanded && (
                        <div className="bg-mauve-50/70 border-t border-border/60 p-2.5 flex flex-col gap-2">
                          {branches.map((sub) => {
                            const subSlug = slugify(sub.label);
                            const subHref = `/category/${catSlug}?sub=${subSlug}`;
                            return (
                              <Link
                                key={sub.id || sub.label}
                                href={subHref}
                                onClick={() => setMenuOpen(false)}
                                className="flex flex-col py-1 px-2 rounded-lg hover:bg-white text-xs"
                              >
                                <span className="font-semibold text-purple-deep">{sub.label}</span>
                                {sub.description && (
                                  <span className="text-[11px] text-tan-dark">{sub.description}</span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="#subscribe"
              onClick={() => setMenuOpen(false)}
              className="mt-5 block text-center bg-lilac text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-sm"
            >
              Subscribe
            </Link>
          </div>
        )}

        {/* Primary Desktop Nav */}
        <nav
          aria-label="Primary"
          className="hidden md:flex gap-7 px-12 max-w-[1400px] mx-auto text-[13px] font-semibold text-purple-deep bg-mauve-50 border-t border-border/60 py-2.5"
        >
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-purple-deep hover:text-rose transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Sticky Translucent Categories Bar */}
      <div className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-border/80 shadow-[0_2px_12px_rgba(90,47,69,0.05)] transition-colors">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          {/* Dynamic Desktop Categories Bar with Hover Dropdown Menus */}
          <nav
            aria-label="Categories"
            className="hidden lg:flex items-center gap-8 text-sm font-semibold text-tan-dark py-0.5"
          >
            {categories.map((cat) => {
              const catSlug = cat.slug || slugify(cat.label);
              const catHref = `/category/${catSlug}`;
              const branches = Array.isArray(cat.subcategories) ? cat.subcategories : [];
              const hasBranches = branches.length > 0;

              return (
                <div key={cat.label} className="relative group py-2.5">
                  <Link
                    href={catHref}
                    className="flex items-center gap-1.5 text-tan-dark group-hover:text-purple-deep transition-colors select-none py-1"
                  >
                    <span>{cat.label}</span>
                    {hasBranches && (
                      <svg
                        className="w-3.5 h-3.5 text-tan-dark/70 group-hover:text-purple-deep group-hover:rotate-180 transition-transform duration-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>

                  {/* Hover Dropdown Menu with Branches */}
                  {hasBranches && (
                    <div className="absolute top-full left-0 z-50 min-w-[340px] max-w-[380px] pt-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-border shadow-[0_16px_36px_rgba(90,47,69,0.12)] p-3.5 flex flex-col gap-1.5 ring-1 ring-black/5">
                        {/* Header with category label and View All */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-mauve-100 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-3.5 rounded-full bg-lilac" aria-hidden="true" />
                            <span className="font-heading text-xs uppercase tracking-wider text-purple-deep font-bold">
                              {cat.label}
                            </span>
                          </div>
                          <Link
                            href={catHref}
                            className="text-[11px] font-semibold text-rose hover:underline"
                          >
                            View all →
                          </Link>
                        </div>

                        {/* Subcategories Branches List */}
                        <div className="flex flex-col gap-1">
                          {branches.map((sub) => {
                            const subSlug = slugify(sub.label);
                            const subHref = `/category/${catSlug}?sub=${subSlug}`;
                            return (
                              <Link
                                key={sub.id || sub.label}
                                href={subHref}
                                className="flex flex-col px-3 py-2 rounded-xl hover:bg-mauve-50/80 transition-all group/item"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-purple-deep group-hover/item:text-lilac transition-colors">
                                    {sub.label}
                                  </span>
                                  <svg
                                    className="w-3 h-3 text-tan-dark/50 group-hover/item:text-lilac group-hover/item:translate-x-0.5 transition-all"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                                {sub.description && (
                                  <span className="text-[11px] text-tan-dark line-clamp-1 mt-0.5 font-normal">
                                    {sub.description}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <Link href="/deals" className="ml-auto text-rose-light font-bold hover:text-rose transition-colors py-2.5">
              Deals
            </Link>
            <Link href="/blog" className="text-tan-dark hover:text-rose transition-colors py-2.5">
              Blog
            </Link>
          </nav>

          {/* Mobile & Tablet Compact Horizontal Scroll Categories */}
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
            {categories.map((cat) => {
              const catSlug = cat.slug || slugify(cat.label);
              return (
                <Link
                  key={cat.label}
                  href={`/category/${catSlug}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-mauve-100/70 hover:bg-lilac hover:text-white whitespace-nowrap text-purple-deep transition-colors shrink-0"
                >
                  {cat.label}
                </Link>
              );
            })}
            <Link
              href="/deals"
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-pink-100/70 text-rose hover:bg-rose hover:text-white whitespace-nowrap transition-colors shrink-0"
            >
              Deals
            </Link>
            <Link
              href="/blog"
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-mauve-100/70 text-purple-deep hover:bg-lilac hover:text-white whitespace-nowrap transition-colors shrink-0"
            >
              Blog
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
