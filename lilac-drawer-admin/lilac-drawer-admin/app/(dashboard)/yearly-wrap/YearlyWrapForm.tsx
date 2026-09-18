"use client";

import { useState, useTransition } from "react";
import ImageUploadField from "@/components/ImageUploadField";
import { updateYearlyWrap } from "@/lib/actions";

interface ProductOption {
  id: number;
  name: string;
  slug?: string | null;
  imageUrl?: string | null;
  affiliateUrl?: string | null;
}

interface CategoryOption {
  id: number;
  label: string;
  slug?: string | null;
}

interface YearlyWrapData {
  id?: number;
  title?: string;
  subtitle?: string;
  isActive?: boolean;

  reviewerAge?: string;
  reviewerAgeLabel?: string;
  reviewerAgeText?: string;

  mostReviewedTitle?: string;
  mostReviewedImageUrl?: string | null;
  mostReviewedImageLabel?: string | null;
  mostReviewedText?: string;
  mostReviewedLinkUrl?: string | null;

  listeningReportLabel?: string;
  listeningReportText?: string;
  listeningReportDate?: string;

  topPickLabel?: string;
  topPickTitle?: string;
  topPickClicks?: string;
  topPickImageUrl?: string | null;
  topPickLinkUrl?: string | null;

  topCategoriesLabel?: string;
  topCategories?: string;
}

interface Props {
  initial: YearlyWrapData | null;
  productsList: ProductOption[];
  categoriesList?: CategoryOption[];
}

export default function YearlyWrapForm({ initial, productsList, categoriesList = [] }: Props) {
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Section 0: Main
  const [title, setTitle] = useState(initial?.title ?? "The Yearly Wrap");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "2026 Shopping Wrapped");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  // 1. Reviewer Age
  const [reviewerAge, setReviewerAge] = useState(initial?.reviewerAge ?? "3");
  const [reviewerAgeLabel, setReviewerAgeLabel] = useState(initial?.reviewerAgeLabel ?? "MY REVIEWER AGE");
  const [reviewerAgeText, setReviewerAgeText] = useState(
    initial?.reviewerAgeText ?? "Three years testing products so readers don't have to guess."
  );

  // 2. Most Reviewed Product
  const [mostReviewedTitle, setMostReviewedTitle] = useState(
    initial?.mostReviewedTitle ?? "Most Reviewed Product"
  );
  const [mostReviewedImageUrl, setMostReviewedImageUrl] = useState(initial?.mostReviewedImageUrl ?? "");
  const [mostReviewedImageLabel, setMostReviewedImageLabel] = useState(
    initial?.mostReviewedImageLabel ?? "Most reviewed product photo"
  );
  const [mostReviewedText, setMostReviewedText] = useState(
    initial?.mostReviewedText ??
      "The garment steamer topped reader clicks all year, reviewed and updated four times."
  );
  const [mostReviewedLinkUrl, setMostReviewedLinkUrl] = useState(initial?.mostReviewedLinkUrl ?? "");

  // 3. Listening Report
  const [listeningReportLabel, setListeningReportLabel] = useState(
    initial?.listeningReportLabel ?? "LISTENING REPORT"
  );
  const [listeningReportText, setListeningReportText] = useState(
    initial?.listeningReportText ??
      "Readers spent the most time this year on care guides, followed by top-10 lists and jewelry storage."
  );
  const [listeningReportDate, setListeningReportDate] = useState(
    initial?.listeningReportDate ?? "Aug 2, 2026"
  );

  // 4. Top Pick
  const [topPickLabel, setTopPickLabel] = useState(initial?.topPickLabel ?? "TOP PICK 2026");
  const [topPickTitle, setTopPickTitle] = useState(initial?.topPickTitle ?? "Steamfast SF-717");
  const [topPickClicks, setTopPickClicks] = useState(initial?.topPickClicks ?? "4,120 clicks");
  const [topPickImageUrl, setTopPickImageUrl] = useState(initial?.topPickImageUrl ?? "");
  const [topPickLinkUrl, setTopPickLinkUrl] = useState(initial?.topPickLinkUrl ?? "");

  // 5. Top Categories
  const [topCategoriesLabel, setTopCategoriesLabel] = useState(
    initial?.topCategoriesLabel ?? "TOP CATEGORIES THIS YEAR"
  );
  const [topCategories, setTopCategories] = useState(
    initial?.topCategories ?? "CLOTHING CARE\nACCESSORIES\nWARDROBE STORAGE\nJEWELRY & WATCHES\nBAGS"
  );

  const field =
    "w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all";

  // Catalog fill helpers
  function handleFillMostReviewed(productId: string) {
    if (!productId) return;
    const p = productsList.find((x) => String(x.id) === productId);
    if (!p) return;
    if (p.imageUrl) setMostReviewedImageUrl(p.imageUrl);
    setMostReviewedText(`${p.name} topped reader clicks all year, reviewed and updated four times.`);
    if (p.slug) {
      setMostReviewedLinkUrl(`/deals/${p.slug}`);
    } else if (p.affiliateUrl) {
      setMostReviewedLinkUrl(p.affiliateUrl);
    } else {
      setMostReviewedLinkUrl(`/deals`);
    }
  }

  function handleFillTopPick(productId: string) {
    if (!productId) return;
    const p = productsList.find((x) => String(x.id) === productId);
    if (!p) return;
    setTopPickTitle(p.name);
    if (p.imageUrl) setTopPickImageUrl(p.imageUrl);
    if (p.slug) {
      setTopPickLinkUrl(`/deals/${p.slug}`);
    } else if (p.affiliateUrl) {
      setTopPickLinkUrl(p.affiliateUrl);
    } else {
      setTopPickLinkUrl(`/deals`);
    }
  }

  function handleAutoFillAllCategories() {
    if (!categoriesList || categoriesList.length === 0) return;
    const lines = categoriesList.map((c) => c.label.trim().toUpperCase());
    setTopCategories(lines.join("\n"));
  }

  function handleToggleCategory(catLabel: string) {
    const formatted = catLabel.trim().toUpperCase();
    const existingLines = topCategories
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (existingLines.some((l) => l.toLowerCase() === formatted.toLowerCase())) {
      const updated = existingLines.filter(
        (l) => l.toLowerCase() !== formatted.toLowerCase()
      );
      setTopCategories(updated.join("\n"));
    } else {
      const updated = [...existingLines, formatted];
      setTopCategories(updated.join("\n"));
    }
  }

  function handleAddCategoryFromSelect(catLabel: string) {
    if (!catLabel) return;
    const formatted = catLabel.trim().toUpperCase();
    const existingLines = topCategories
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!existingLines.some((l) => l.toLowerCase() === formatted.toLowerCase())) {
      const updated = [...existingLines, formatted];
      setTopCategories(updated.join("\n"));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("isActive", isActive ? "true" : "false");

    startTransition(async () => {
      try {
        await updateYearlyWrap(formData);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } catch (err) {
        console.error("Failed to save Yearly Wrap", err);
      }
    });
  }

  const categoryLines = topCategories
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-[1000px]">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-purple-deep">إعدادات حصاد العام</h1>
          <p className="text-sm text-tan-dark mt-1">
            تخصيص وإدارة بطاقة الحصاد السنوي التحريرية المعروضة بشكل بارز في صفحة المدونة (/blog).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full animate-fade-in">
              تم الحفظ بنجاح!
            </span>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="bg-rose text-white rounded-full px-6 py-2 text-sm font-semibold shadow-md hover:bg-rose-dark transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      {/* Section Active Toggle & Main Headings */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-border flex-wrap">
          <div>
            <span className="font-heading font-bold text-purple-deep text-base">ظهور القسم والعناوين الرئيسية</span>
            <p className="text-xs text-tan-dark mt-0.5">التحكم في تفعيل ظهور هذا القسم ونصوص العناوين.</p>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-rose focus:ring-rose accent-rose cursor-pointer"
            />
            <span className="text-sm font-semibold text-purple-deep">
              {isActive ? "نشط في المدونة" : "مخفي من المدونة"}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              عنوان القسم
            </label>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={field}
              placeholder="حصاد العام"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              العنوان الفرعي / الشعار
            </label>
            <input
              name="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={field}
              placeholder="حصاد تسوق عام 2026"
              required
            />
          </div>
        </div>
      </div>

      {/* Grid of 5 Editable Parts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Reviewer Age & Experience */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <div className="border-b border-border pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose">القسم 1</span>
            <h2 className="font-heading font-bold text-purple-deep text-lg mt-0.5">خبرة المراجع وسنوات التجربة</h2>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              نص الشارة
            </label>
            <input
              name="reviewerAgeLabel"
              value={reviewerAgeLabel}
              onChange={(e) => setReviewerAgeLabel(e.target.value)}
              className={field}
              placeholder="سنوات خبرتي في المراجعة"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              سنوات الخبرة (رقم / إحصائية)
            </label>
            <input
              name="reviewerAge"
              value={reviewerAge}
              onChange={(e) => setReviewerAge(e.target.value)}
              className={field}
              placeholder="3"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              وصف الخبرة
            </label>
            <textarea
              name="reviewerAgeText"
              value={reviewerAgeText}
              onChange={(e) => setReviewerAgeText(e.target.value)}
              rows={3}
              className={field}
              placeholder="ثلاث سنوات في تجربة المنتجات بدقة حتى لا يضطر القراء للتخمين."
              required
            />
          </div>
        </div>

        {/* 3. Listening Report */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <div className="border-b border-border pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose">القسم 3</span>
            <h2 className="font-heading font-bold text-purple-deep text-lg mt-0.5">تقرير اهتمامات القراء</h2>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              تسمية التقرير
            </label>
            <input
              name="listeningReportLabel"
              value={listeningReportLabel}
              onChange={(e) => setListeningReportLabel(e.target.value)}
              className={field}
              placeholder="تقرير القراءة والاستماع"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              تاريخ التقرير / الوسم
            </label>
            <input
              name="listeningReportDate"
              value={listeningReportDate}
              onChange={(e) => setListeningReportDate(e.target.value)}
              className={field}
              placeholder="2 أغسطس 2026"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              ملخص التقرير والمحتوى
            </label>
            <textarea
              name="listeningReportText"
              value={listeningReportText}
              onChange={(e) => setListeningReportText(e.target.value)}
              rows={3}
              className={field}
              placeholder="قضى القراء معظم الوقت هذا العام في أدلة العناية، تليها قوائم أفضل 10 وتنظيم المجوهرات."
              required
            />
          </div>
        </div>

        {/* 2. Most Reviewed Product (Span 2) */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose">القسم 2</span>
              <h2 className="font-heading font-bold text-purple-deep text-lg mt-0.5">المنتج الأكثر مراجعة</h2>
            </div>
            {productsList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-tan-dark font-medium">تعبئة سريعة من الكتالوج:</span>
                <select
                  className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-mauve-50 text-purple-deep font-medium outline-none focus:border-rose cursor-pointer"
                  onChange={(e) => handleFillMostReviewed(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>اختر منتجاً...</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
                عنوان البطاقة
              </label>
              <input
                name="mostReviewedTitle"
                value={mostReviewedTitle}
                onChange={(e) => setMostReviewedTitle(e.target.value)}
                className={field}
                placeholder="المنتج الأكثر مراجعة"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
                رابط الوجهة (اختياري)
              </label>
              <input
                name="mostReviewedLinkUrl"
                value={mostReviewedLinkUrl}
                onChange={(e) => setMostReviewedLinkUrl(e.target.value)}
                className={field}
                placeholder="/deals/garment-steamer أو https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              صورة المنتج
            </label>
            <ImageUploadField
              name="mostReviewedImageUrl"
              value={mostReviewedImageUrl}
              onChange={setMostReviewedImageUrl}
              kind="yearly_wrap"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
                النص البديل / تسمية الصورة
              </label>
              <input
                name="mostReviewedImageLabel"
                value={mostReviewedImageLabel}
                onChange={(e) => setMostReviewedImageLabel(e.target.value)}
                className={field}
                placeholder="صورة المنتج الأكثر مراجعة"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
                النص التلخيصي والوصف
              </label>
              <textarea
                name="mostReviewedText"
                value={mostReviewedText}
                onChange={(e) => setMostReviewedText(e.target.value)}
                rows={2}
                className={field}
                placeholder="تصدر هذا المنتج نقرات القراء طوال العام مع تحديث مراجعته عدة مرات."
                required
              />
            </div>
          </div>
        </div>

        {/* 4. Top Pick 2026 */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose">القسم 4</span>
              <h2 className="font-heading font-bold text-purple-deep text-lg mt-0.5">المنتج الأعلى تقييماً (Top Pick)</h2>
            </div>
            {productsList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-tan-dark font-medium">تعبئة سريعة:</span>
                <select
                  className="text-xs border border-border rounded-lg px-2 py-1 bg-mauve-50 text-purple-deep font-medium outline-none focus:border-rose cursor-pointer"
                  onChange={(e) => handleFillTopPick(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>اختر منتجاً...</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              نص الشارة
            </label>
            <input
              name="topPickLabel"
              value={topPickLabel}
              onChange={(e) => setTopPickLabel(e.target.value)}
              className={field}
              placeholder="أفضل اختيار 2026"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
                اسم المنتج
              </label>
              <input
                name="topPickTitle"
                value={topPickTitle}
                onChange={(e) => setTopPickTitle(e.target.value)}
                className={field}
                placeholder="Steamfast SF-717"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
                النقرات / الإحصائية
              </label>
              <input
                name="topPickClicks"
                value={topPickClicks}
                onChange={(e) => setTopPickClicks(e.target.value)}
                className={field}
                placeholder="4,120 نقرة"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              الصورة المصغرة الدائرية
            </label>
            <ImageUploadField
              name="topPickImageUrl"
              value={topPickImageUrl}
              onChange={setTopPickImageUrl}
              kind="yearly_wrap"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              رابط المنتج (اختياري)
            </label>
            <input
              name="topPickLinkUrl"
              value={topPickLinkUrl}
              onChange={(e) => setTopPickLinkUrl(e.target.value)}
              className={field}
              placeholder="/deals/steamfast أو https://..."
            />
          </div>
        </div>

        {/* 5. Top Categories */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose">القسم 5</span>
              <h2 className="font-heading font-bold text-purple-deep text-lg mt-0.5">قائمة الأقسام الأكثر شعبية</h2>
            </div>
            {categoriesList && categoriesList.length > 0 && (
              <button
                type="button"
                onClick={handleAutoFillAllCategories}
                className="text-xs font-semibold bg-mauve-100 hover:bg-mauve-200 text-purple-deep px-3 py-1.5 rounded-lg border border-border transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>تعبئة تلقائية لجميع الأقسام</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              عنوان قائمة الأقسام
            </label>
            <input
              name="topCategoriesLabel"
              value={topCategoriesLabel}
              onChange={(e) => setTopCategoriesLabel(e.target.value)}
              className={field}
              placeholder="الأقسام الأكثر زيارة هذا العام"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark">
                أسماء الأقسام (قسم في كل سطر)
              </label>
              {categoriesList && categoriesList.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-tan-dark font-medium">إضافة سريعة:</span>
                  <select
                    className="text-xs border border-border rounded-lg px-2 py-1 bg-mauve-50 text-purple-deep font-medium outline-none focus:border-rose cursor-pointer"
                    onChange={(e) => {
                      handleAddCategoryFromSelect(e.target.value);
                      e.target.value = "";
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>اختر قسماً للإضافة...</option>
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.label}>
                        + {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <textarea
              name="topCategories"
              value={topCategories}
              onChange={(e) => setTopCategories(e.target.value)}
              rows={5}
              className={`${field} font-mono text-xs leading-relaxed`}
              placeholder="العناية بالملابس&#10;الإكسسوارات&#10;تنظيم الخزانة&#10;المجوهرات والساعات&#10;الحقائب"
              required
            />
            <p className="text-[11px] text-tan mt-1.5">
              سيتم عرض كل سطر بخط عريض وواضح في قسم الأقسام الأكثر شعبية.
            </p>
          </div>

          {/* Clickable site category badges */}
          {categoriesList && categoriesList.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-tan-dark">
                أقسام الموقع المتاحة (انقر للتبديل):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categoriesList.map((cat) => {
                  const isSelected = categoryLines.some(
                    (c) => c.toLowerCase() === cat.label.trim().toLowerCase()
                  );
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleCategory(cat.label)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-purple-deep text-white border-purple-deep font-semibold shadow-xs"
                          : "bg-mauve-50 text-purple-deep border-border hover:bg-mauve-100 hover:border-rose font-medium"
                      }`}
                    >
                      <span className="text-[11px]">{isSelected ? "✓" : "+"}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Blog Preview */}
      <div className="bg-[#fbf6f0] border border-border rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-deep flex items-center gap-1.5">
            <svg className="w-4 h-4 text-purple-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            المعاينة المباشرة في صفحة المدونة (/blog)
          </div>
          <span className="text-[11px] text-tan-dark font-medium">التصميم الفعلي كما يظهر للزوار</span>
        </div>

        <div className="border-2 border-purple-deep p-6 md:p-10 bg-[#fffdfb] max-w-[800px] mx-auto">
          <h2 className="font-heading text-3xl md:text-5xl font-black text-center text-purple-deep tracking-tight">
            {title || "حصاد العام"}
          </h2>
          <div className="text-center text-[12px] tracking-[0.2em] uppercase text-rose font-bold my-1.5 mb-5">
            {subtitle || "حصاد تسوق عام 2026"}
          </div>
          <div className="border-t-2 border-b border-purple-deep h-[3px] mb-5" />

          {/* Top 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr] border-t border-b border-purple-deep">
            {/* 1. Reviewer Age */}
            <div className="p-5 md:border-l border-purple-deep text-center">
              <div className="text-[10px] tracking-wider uppercase font-bold underline mb-2">
                {reviewerAgeLabel || "سنوات خبرتي في المراجعة"}
              </div>
              <div className="font-heading text-5xl font-black text-purple-deep leading-none">
                {reviewerAge || "3"}
              </div>
              <p className="text-[11px] leading-relaxed text-tan-dark mt-2">
                {reviewerAgeText || "ثلاث سنوات في تجربة المنتجات بدقة حتى لا يضطر القراء للتخمين."}
              </p>
            </div>

            {/* 2. Most Reviewed */}
            <div className="p-5 md:border-l border-purple-deep text-center">
              <div className="text-xs font-semibold text-purple-deep mb-2.5">
                {mostReviewedTitle || "المنتج الأكثر مراجعة"}
              </div>
              <div className="w-full h-[160px] rounded-lg bg-mauve-100 overflow-hidden border border-border flex items-center justify-center">
                {mostReviewedImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mostReviewedImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-tan font-medium">صورة المنتج</span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-tan-dark mt-2">
                {mostReviewedText || "تصدر هذا المنتج نقرات القراء طوال العام مع تحديث مراجعته عدة مرات."}
              </p>
            </div>

            {/* 3. Listening Report */}
            <div className="p-5 text-center">
              <div className="text-[10px] tracking-wider uppercase font-bold underline mb-2">
                {listeningReportLabel || "تقرير القراءة والاستماع"}
              </div>
              <p className="text-[11px] leading-relaxed text-tan-dark mb-2.5">
                {listeningReportText || "قضى القراء معظم الوقت هذا العام في أدلة العناية، تليها قوائم أفضل 10 وتنظيم المجوهرات."}
              </p>
              <div className="font-heading text-xs font-bold text-purple-deep">
                {listeningReportDate || "2 أغسطس 2026"}
              </div>
            </div>
          </div>

          {/* Bottom 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-purple-deep">
            {/* 4. Top Pick */}
            <div className="p-5 md:border-l border-purple-deep flex gap-4 items-center">
              <div className="w-14 h-14 rounded-full bg-purple-deep shrink-0 overflow-hidden flex items-center justify-center text-white font-bold">
                {topPickImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={topPickImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] uppercase font-bold">مفضل</span>
                )}
              </div>
              <div>
                <div className="text-[10px] tracking-wider uppercase font-bold mb-0.5">
                  {topPickLabel || "أفضل اختيار 2026"}
                </div>
                <div className="font-heading text-sm font-bold text-purple-deep">
                  {topPickTitle || "Steamfast SF-717"}
                </div>
                <div className="text-[11px] text-tan">{topPickClicks || "4,120 نقرة"}</div>
              </div>
            </div>

            {/* 5. Top Categories */}
            <div className="p-5">
              <div className="text-[10px] tracking-wider uppercase font-bold underline mb-2">
                {topCategoriesLabel || "الأقسام الأكثر زيارة هذا العام"}
              </div>
              <div className="font-heading text-xs font-bold text-purple-deep leading-relaxed tracking-wide">
                {categoryLines.map((cat, idx) => (
                  <div key={idx}>{cat}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {savedSuccess && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            تم الحفظ بنجاح!
          </span>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="bg-rose text-white rounded-full px-7 py-2.5 text-sm font-semibold shadow-md hover:bg-rose-dark transition-all cursor-pointer disabled:opacity-50"
        >
          {isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </form>
  );
}
