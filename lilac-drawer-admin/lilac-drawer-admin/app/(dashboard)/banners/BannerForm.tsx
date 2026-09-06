"use client";

import { useState } from "react";
import Link from "next/link";
import ImageUploadField from "@/components/ImageUploadField";

interface BannerData {
  id?: number;
  title?: string;
  subtitle?: string | null;
  imageUrl?: string;
  imageLabel?: string | null;
  linkUrl?: string;
  placement?: string;
  sortOrder?: number;
  isActive?: boolean;
  badgeText?: string | null;
}

interface Props {
  initial?: BannerData | null;
  action: (formData: FormData) => Promise<void>;
  title: string;
  submitLabel: string;
}

export default function BannerForm({ initial, action, title, submitLabel }: Props) {
  const [bannerTitle, setBannerTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [badgeText, setBadgeText] = useState(initial?.badgeText ?? "Sponsored");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const field =
    "w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all";

  return (
    <form action={action} className="flex flex-col gap-8 max-w-[860px]">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-purple-deep">{title}</h1>
          <p className="text-sm text-tan-dark mt-1">
            Configure advertisement banners for the community infinite auto-scrolling carousel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/banners"
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-purple-deep hover:bg-mauve-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-rose text-white rounded-full px-6 py-2 text-sm font-semibold shadow-md hover:bg-rose-dark transition-all cursor-pointer"
          >
            {submitLabel}
          </button>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="bg-mauve-50/70 border border-border-mauve rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-deep flex items-center gap-1.5">
            <svg className="w-4 h-4 text-purple-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Live Banner Preview
          </div>
          <span className="text-[11px] text-tan">Preview as rendered on /community</span>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-border bg-purple-deep min-h-[180px] flex flex-col justify-end">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-purple-deep flex items-center justify-center text-white/50 text-sm font-medium">
              Upload or paste an image URL to preview photo
            </div>
          )}

          {/* Solid dark scrim for readability */}
          <div className="absolute inset-0 bg-purple-deep/80" />

          {/* Badge */}
          <div className="absolute top-3 right-3 z-10">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-purple-deep bg-cream/95 px-2.5 py-0.5 rounded-full shadow-xs">
              {badgeText || "Sponsored"}
            </span>
          </div>

          {/* Content */}
          <div className="relative z-10 p-5 text-white flex items-end justify-between gap-4">
            <div className="max-w-[480px]">
              <h4 className="font-heading text-xl font-bold leading-tight drop-shadow-sm mb-1 text-white">
                {bannerTitle || "Advertisement Headline"}
              </h4>
              <p className="text-xs sm:text-sm text-pink-100 font-medium leading-snug drop-shadow-xs">
                {subtitle || "Promotional subtitle, discount code, or campaign description."}
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose text-white text-xs font-semibold shadow-md">
                Shop Now →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-[var(--shadow-card)]">
        <h2 className="font-heading text-lg font-bold text-purple-deep border-b border-border pb-3">
          Banner Information
        </h2>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
            Banner Title / Headline <span className="text-rose">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            value={bannerTitle}
            onChange={(e) => setBannerTitle(e.target.value)}
            placeholder="e.g. Summer Glow Makeup Essentials"
            className={field}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
            Subtitle / Description
          </label>
          <input
            type="text"
            name="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Exclusive 20% off with code GLOW20"
            className={field}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              Badge Label
            </label>
            <input
              type="text"
              name="badgeText"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="Sponsored, Ad, Special Offer..."
              className={field}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              Target Destination Link <span className="text-rose">*</span>
            </label>
            <input
              type="text"
              name="linkUrl"
              required
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://brand.com/deal or /blog/best-eyeliners"
              className={field}
            />
          </div>
        </div>

        {/* Image Upload & URL */}
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
            Banner Image <span className="text-rose">*</span>
          </label>
          <p className="text-xs text-tan-dark mb-2">
            Upload an image from your device or paste a high-resolution image URL. Recommended aspect ratio: 16:9 or 3:1.
          </p>
          <ImageUploadField
            name="imageUrl"
            defaultValue={initial?.imageUrl ?? ""}
            value={imageUrl}
            onChange={setImageUrl}
            kind="banners"
          />
          <div className="mt-2">
            <input
              type="text"
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste direct image URL (https://...)"
              className={field}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
            Image Alt Text
          </label>
          <input
            type="text"
            name="imageLabel"
            defaultValue={initial?.imageLabel ?? ""}
            placeholder="Description for accessibility (e.g. Rare Beauty Liquid Blush Promo)"
            className={field}
          />
        </div>

        {/* Placement & Status */}
        <div className="grid sm:grid-cols-2 gap-5 border-t border-border pt-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              Placement
            </label>
            <select
              name="placement"
              defaultValue={initial?.placement ?? "community_banner"}
              className={field}
            >
              <option value="community_banner">Community Feed Carousel</option>
              <option value="home_top">Home Top Banner</option>
              <option value="deals_sidebar">Deals Sidebar Banner</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              Display Order (Sort Order)
            </label>
            <input
              type="number"
              name="sortOrder"
              defaultValue={initial?.sortOrder ?? 0}
              placeholder="0"
              className={field}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-rose focus:ring-rose accent-rose cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-purple-deep">Active Banner</span>
              <p className="text-xs text-tan-dark">
                When checked, this banner is displayed in the live auto-scrolling carousel.
              </p>
            </div>
          </label>
        </div>
      </div>
    </form>
  );
}
