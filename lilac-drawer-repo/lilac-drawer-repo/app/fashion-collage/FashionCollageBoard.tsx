"use client";

import { useState } from "react";
import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";

const categories = [
  { id: "clothing", label: "Clothing" },
  { id: "accessories", label: "Accessories" },
  { id: "shoes", label: "Shoes" },
  { id: "bags", label: "Bags" },
  { id: "beauty", label: "Beauty" },
];

const boardItems = [
  { id: "b1", label: "Sweater", left: "6%", top: "10%", width: "34%", height: "38%" },
  { id: "b2", label: "Scarf", left: "44%", top: "8%", width: "26%", height: "26%" },
  { id: "b3", label: "Jewelry box", left: "10%", top: "54%", width: "24%", height: "30%" },
  { id: "b4", label: "Shoulder bag", left: "40%", top: "42%", width: "30%", height: "34%" },
  { id: "b5", label: "Cedar blocks", left: "74%", top: "12%", width: "20%", height: "22%" },
];

export default function FashionCollageBoard() {
  const [activeCategory, setActiveCategory] = useState("clothing");

  return (
    <div
      className="bg-cream text-purple-deep min-h-screen grid grid-cols-[72px_1fr] md:grid-cols-[88px_1fr]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <h1 className="sr-only">Fashion Collage — arrange your favorite pieces into a moodboard</h1>
      {/* left sidebar: categories */}
      <aside className="border-r border-border py-5 flex flex-col items-center gap-1.5">
        <label className="w-16 px-1 py-3 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer">
          <span className="text-xl" aria-hidden="true">↑</span>
          <span className="text-[10px] font-medium text-tan-dark text-center leading-tight">Upload</span>
          <input type="file" accept="image/*" className="hidden" />
        </label>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`w-16 px-1 py-2.5 rounded-xl flex flex-col items-center justify-center transition-colors ${
              activeCategory === cat.id ? "bg-mauve-100 text-purple-deep font-bold" : "hover:bg-mauve-50 text-tan-dark"
            }`}
            aria-pressed={activeCategory === cat.id}
          >
            <span className="text-[11px] font-semibold text-center leading-tight">{cat.label}</span>
          </button>
        ))}
      </aside>

      <div className="flex flex-col h-screen overflow-hidden">
        {/* top bar */}
        <div className="flex items-center gap-4 px-6 py-3.5 border-b border-border bg-cream-alt flex-wrap">
          <Link href="/" className="text-xl font-bold text-lilac">
            Lilac Drawer
          </Link>
          <div className="w-px h-6 bg-border" aria-hidden="true" />
          <nav aria-label="Primary" className="hidden sm:flex gap-5 text-[13px] font-semibold text-tan-dark">
            <Link href="/" className="text-tan-dark">Home</Link>
            <Link href="/community" className="text-tan-dark">Community</Link>
            <Link href="/explore" className="text-tan-dark">Explore</Link>
            <Link href="/profile" className="text-tan-dark">Profile</Link>
          </nav>
          <form role="search" className="flex-1 min-w-[120px] max-w-[280px] flex items-center gap-2.5 bg-mauve-50 rounded-full px-4 py-2">
            <label htmlFor="collage-search" className="sr-only">Search pieces</label>
            <svg width="15" height="15" viewBox="0 0 256 256" fill="#b89a7a" aria-hidden="true">
              <path d="M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z" />
            </svg>
            <input id="collage-search" type="search" placeholder="Search pieces..." className="border-none bg-transparent outline-none text-[13px] flex-1" />
          </form>
          <div className="ml-auto flex gap-2 shrink-0">
            <button type="button" className="border-[1.5px] border-border-mauve text-tan-dark px-4.5 py-2 rounded-full text-[13px] font-semibold">
              Save
            </button>
            <button type="button" className="border-[1.5px] border-border-mauve text-tan-dark px-4.5 py-2 rounded-full text-[13px] font-semibold">
              Share
            </button>
            <button type="button" className="bg-lilac text-white px-5 py-2 rounded-full text-[13px] font-semibold">
              Follow
            </button>
          </div>
        </div>

        {/* canvas */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-6 md:px-8 py-5 bg-mauve-50 relative">
          <div className="relative w-full max-w-[920px] h-full max-h-[760px] bg-white rounded-[20px] shadow-[0_20px_50px_rgba(80,60,70,0.1)] overflow-hidden">
            {boardItems.map((item) => (
              <ImageSlot
                key={item.id}
                label={item.label}
                className="absolute"
                shape="rounded"
                radius={14}
                tone="mauve"
                style={{ left: item.left, top: item.top, width: item.width, height: item.height }}
              />
            ))}

            <div className="absolute bottom-3.5 right-3.5 flex gap-2 bg-white rounded-full p-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[15px] cursor-pointer hover:bg-mauve-50">−</span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[15px] cursor-pointer hover:bg-mauve-50">+</span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer hover:bg-mauve-50">↻</span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer hover:bg-mauve-50">
                <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </span>
            </div>
            <div className="absolute top-3.5 left-3.5 bg-white rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-tan shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
              Drag pieces to arrange
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
