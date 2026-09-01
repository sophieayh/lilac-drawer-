"use client";

import { useState } from "react";
import { slugify } from "@/lib/slugify";
import ImageUploadField from "@/components/ImageUploadField";
import type { products } from "@/db/schema";

type Product = typeof products.$inferSelect;

const CATEGORY_SUGGESTIONS = [
  "Clothing Care",
  "Accessories",
  "Wardrobe Storage",
  "Jewelry & Watches",
  "Bags",
  "Steamers",
  "Cleaning Tools",
  "Style",
  "Trending",
];

const PLACEMENT_FLAGS: { key: keyof Product; label: string }[] = [
  { key: "isFeaturedHome", label: "Home — Featured" },
  { key: "isTopPick", label: "Home — Top 10 Picks" },
  { key: "isFeaturedDeals", label: "Deals — Featured" },
  { key: "isSaleOff", label: "Deals — Sale" },
  { key: "isTodayDeal", label: "Deals — Today's Deal" },
  { key: "isNewArrival", label: "New Arrival" },
  { key: "isBestSeller", label: "Best Seller" },
  { key: "isExploreDeal", label: "Explore — Deal" },
  { key: "isRecommended", label: "Explore — Recommended" },
  { key: "isSaved", label: "Saved Picks" },
  { key: "isSuggested", label: "Suggested" },
];

export default function ProductForm({ product, action }: { product?: Product; action: (formData: FormData) => Promise<void> }) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  const field = "w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lilac";
  const labelCls = "block text-xs font-semibold text-purple-deep mb-1.5";

  return (
    <form action={action} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="name">
            Product name
          </label>
          <input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={field}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="category">
            Category
          </label>
          <input id="category" name="category" list="category-suggestions" defaultValue={product?.category} required className={field} />
          <datalist id="category-suggestions">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="subtitle">
            Subtitle <span className="text-tan-dark font-normal normal-case">(optional — e.g. &quot;Editor&apos;s Choice&quot;)</span>
          </label>
          <input id="subtitle" name="subtitle" defaultValue={product?.subtitle ?? ""} className={field} />
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-semibold text-purple-deep uppercase tracking-wide mb-3">Affiliate / API link</p>
        <label className={labelCls} htmlFor="affiliateUrl">
          Affiliate link
        </label>
        <input
          id="affiliateUrl"
          name="affiliateUrl"
          type="url"
          placeholder="https://www.amazon.com/dp/...?tag=yourtag-20"
          defaultValue={product?.affiliateUrl ?? ""}
          className={field}
        />
        <p className="text-xs text-tan-dark mt-1.5">
          Paste the tracked/affiliate link from your commission program (Amazon Associates, CJ, ShareASale, etc.) — this is where
          the &quot;Buy&quot; button on the site will point.
        </p>
      </div>

      <div className="border-t border-border pt-5 grid sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls} htmlFor="price">
            Price (USD)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""}
            className={field}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="compareAtPrice">
            Compare-at price
          </label>
          <input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.compareAtPriceCents != null ? (product.compareAtPriceCents / 100).toFixed(2) : ""}
            className={field}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="discountPercent">
            Discount %
          </label>
          <input
            id="discountPercent"
            name="discountPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={product?.discountPercent ?? ""}
            className={field}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="rank">
            Top 10 rank
          </label>
          <input id="rank" name="rank" type="number" min="1" defaultValue={product?.rank ?? ""} className={field} />
        </div>
        <div>
          <label className={labelCls} htmlFor="badge">
            Badge
          </label>
          <input id="badge" name="badge" placeholder="NEW, HOT…" defaultValue={product?.badge ?? ""} className={field} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input id="inStock" name="inStock" type="checkbox" defaultChecked={product?.inStock ?? true} className="size-4" />
          <label htmlFor="inStock" className="text-sm text-purple-deep">
            In stock
          </label>
        </div>
        <div className="sm:col-span-3">
          <label className={labelCls} htmlFor="rankNote">
            Rank note <span className="text-tan-dark font-normal normal-case">(optional)</span>
          </label>
          <input id="rankNote" name="rankNote" defaultValue={product?.rankNote ?? ""} className={field} />
        </div>
      </div>

      <div className="border-t border-border pt-5 grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="imageLabel">
            Image alt text
          </label>
          <input id="imageLabel" name="imageLabel" defaultValue={product?.imageLabel ?? ""} className={field} />
        </div>
        <div>
          <label className={labelCls} htmlFor="imageUrl">
            Photo
          </label>
          <ImageUploadField name="imageUrl" defaultValue={product?.imageUrl} kind="products" />
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-semibold text-purple-deep uppercase tracking-wide mb-3">Where it appears on the site</p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {PLACEMENT_FLAGS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-purple-deep">
              <input type="checkbox" name={key} defaultChecked={Boolean(product?.[key])} className="size-4" />
              {label}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="bg-lilac text-white rounded-full py-3 font-semibold text-sm self-start px-8">
        {product ? "Save changes" : "Add product"}
      </button>
    </form>
  );
}
