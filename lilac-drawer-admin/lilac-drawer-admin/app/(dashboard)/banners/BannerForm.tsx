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
  const [badgeText, setBadgeText] = useState(initial?.badgeText ?? "إعلان مميز");
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
            تهيئة البانرات والحملات الإعلانية لشريط التمرير التلقائي اللانهائي.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/banners"
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-purple-deep hover:bg-mauve-50 transition-colors"
          >
            إلغاء
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
            معاينة مباشرة للبانر
          </div>
          <span className="text-[11px] text-tan">المعاينة المباشرة كما تظهر للزوار</span>
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
              ارفع صورة أو الصق رابط صورة لمعاينة البانر
            </div>
          )}

          {/* Solid dark scrim for readability */}
          <div className="absolute inset-0 bg-purple-deep/80" />

          {/* Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-purple-deep bg-cream/95 px-2.5 py-0.5 rounded-full shadow-xs">
              {badgeText || "إعلان مميز"}
            </span>
          </div>

          {/* Content */}
          <div className="relative z-10 p-5 text-white flex items-end justify-between gap-4">
            <div className="max-w-[480px]">
              <h4 className="font-heading text-xl font-bold leading-tight drop-shadow-sm mb-1 text-white">
                {bannerTitle || "عنوان الحملة الإعلانية"}
              </h4>
              <p className="text-xs sm:text-sm text-pink-100 font-medium leading-snug drop-shadow-xs">
                {subtitle || "العنوان الفرعي، كود الخصم، أو تفاصيل العرض الترويجي."}
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose text-white text-xs font-semibold shadow-md">
                تسوق الآن ←
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-[var(--shadow-card)]">
        <h2 className="font-heading text-lg font-bold text-purple-deep border-b border-border pb-3">
          بيانات البانر
        </h2>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
            عنوان البانر الرئيسي <span className="text-rose">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            value={bannerTitle}
            onChange={(e) => setBannerTitle(e.target.value)}
            placeholder="مثال: أساسيات مكياج الإشراقة الصيفية"
            className={field}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
            العنوان الفرعي / الوصف
          </label>
          <input
            type="text"
            name="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="مثال: خصم حصري 20% مع كود GLOW20"
            className={field}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              نص الشارة الترويجية
            </label>
            <input
              type="text"
              name="badgeText"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="إعلان مميز، عرض حصري..."
              className={field}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              الرابط المستهدف <span className="text-rose">*</span>
            </label>
            <input
              type="text"
              name="linkUrl"
              required
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://brand.com/deal أو /blog/best-eyeliners"
              className={field}
              dir="ltr"
            />
          </div>
        </div>

        {/* Image Upload & URL */}
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
            صورة البانر <span className="text-rose">*</span>
          </label>
          <p className="text-xs text-tan-dark mb-2">
            ارفع صورة من جهازك أو الصق رابط صورة عالية الدقة. نسبة العرض إلى الارتفاع الموصى بها: 16:9 أو 3:1.
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
              placeholder="أو الصق رابط الصورة المباشر (https://...)"
              className={field}
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
            النص البديل للصورة (Alt Text)
          </label>
          <input
            type="text"
            name="imageLabel"
            defaultValue={initial?.imageLabel ?? ""}
            placeholder="وصف للصورة لتسهيل الوصول ومحركات البحث"
            className={field}
          />
        </div>

        {/* Placement & Status */}
        <div className="grid sm:grid-cols-2 gap-5 border-t border-border pt-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              مكان العرض
            </label>
            <select
              name="placement"
              defaultValue={initial?.placement ?? "community_banner"}
              className={field}
            >
              <option value="community_banner">شريط مجتمع ليلك التفاعلي (Carousel)</option>
              <option value="home_top">بانر أعلى الصفحة الرئيسية</option>
              <option value="deals_sidebar">شريط العروض الجانبي</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              ترتيب العرض (Sort Order)
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
              <span className="text-sm font-bold text-purple-deep">تفعيل البانر</span>
              <p className="text-xs text-tan-dark">
                عند التفعيل، سيظهر البانر مباشرة في شريط العرض التفاعلي على الموقع.
              </p>
            </div>
          </label>
        </div>
      </div>
    </form>
  );
}

