"use client";

import { useState } from "react";
import Link from "next/link";

const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Deals", href: "/deals" },
  { label: "Blog", href: "/blog" },
  { label: "Explore", href: "/explore" },
  { label: "Community", href: "/community" },
  { label: "Collage", href: "/fashion-collage" },
];

const categoryNav = [
  "Clothing Care",
  "Accessories",
  "Wardrobe Storage",
  "Jewelry & Watches",
  "Bags",
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-cream-alt">
      {/* affiliate disclosure bar */}
      <div className="bg-mauve-100 text-tan-dark text-center py-2 px-6 text-[13px]">
        Reader-supported. When you buy through links on our site, we may earn an affiliate
        commission.{" "}
        <Link href="/blog" className="text-gold font-semibold">
          Learn more
        </Link>
      </div>

      <div className="flex items-center justify-between gap-8 px-6 md:px-12 py-5 max-w-[1400px] mx-auto">
        <Link
          href="/"
          className="font-heading text-[28px] md:text-[32px] text-lilac tracking-tight"
        >
          Lilac <span className="text-gold">Drawer</span>
        </Link>
        <form
          role="search"
          className="flex-1 max-w-[480px] hidden md:flex items-center gap-2.5 bg-mauve-50 rounded-full px-4.5 py-2.5"
        >
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
        <Link
          href="/profile"
          aria-label="Profile"
          className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-mauve-50 text-purple-deep shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
          </svg>
        </Link>
        <Link
          href="#subscribe"
          className="hidden sm:inline-block bg-lilac text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-[0_2px_8px_rgba(201,163,198,0.35)] whitespace-nowrap"
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

      {/* Mobile nav — the md:hidden panel below replaces this entirely at
          and above the md breakpoint, so this is the only way a phone-width
          visitor can reach any page other than Home/Subscribe. */}
      {menuOpen && (
        <div id="mobile-nav" className="md:hidden border-t border-border bg-mauve-50 px-6 py-4">
          <form role="search" className="flex items-center gap-2.5 bg-white rounded-full px-4.5 py-2.5 mb-4">
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
          <nav aria-label="Primary" className="flex flex-col gap-1">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-purple-deep font-semibold text-sm py-2.5 border-b border-border"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="text-purple-deep font-semibold text-sm py-2.5 border-b border-border"
            >
              Profile
            </Link>
          </nav>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-xs font-semibold text-tan-dark">
            {categoryNav.map((label) => (
              <Link key={label} href="/deals" onClick={() => setMenuOpen(false)} className="hover:text-rose">
                {label}
              </Link>
            ))}
          </div>
          <Link
            href="#subscribe"
            onClick={() => setMenuOpen(false)}
            className="mt-4 block text-center bg-lilac text-white px-6 py-2.5 rounded-full text-sm font-semibold"
          >
            Subscribe
          </Link>
        </div>
      )}

      <nav
        aria-label="Primary"
        className="hidden md:flex gap-7 px-12 max-w-[1400px] mx-auto text-[13px] font-semibold text-purple-deep bg-mauve-50 border-t border-b border-border py-2.5"
      >
        {primaryNav.map((item) => (
          <Link key={item.href} href={item.href} className="text-purple-deep hover:text-rose">
            {item.label}
          </Link>
        ))}
      </nav>

      <nav
        aria-label="Categories"
        className="hidden lg:flex gap-7 px-12 max-w-[1400px] mx-auto text-sm font-semibold text-tan-dark py-4"
      >
        {categoryNav.map((label) => (
          <Link key={label} href="/deals" className="text-tan-dark hover:text-rose">
            {label}
          </Link>
        ))}
        <Link href="/deals" className="ml-auto text-rose-light font-bold">
          ♥ Deals
        </Link>
        <Link href="/blog" className="text-tan-dark hover:text-rose">
          Blog
        </Link>
      </nav>
    </header>
  );
}
