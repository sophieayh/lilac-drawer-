"use client";

import { useState } from "react";
import { slugify } from "@/lib/slugify";
import ImageUploadField from "@/components/ImageUploadField";
import CategorySelectField from "@/components/CategorySelectField";
import type { products, siteCategories, ArticleStorePrice } from "@/db/schema";

type Product = typeof products.$inferSelect;
type SiteCategory = typeof siteCategories.$inferSelect;

const STORE_SUGGESTIONS = ["Amazon", "Walmart", "Best Buy", "Target", "eBay", "B&H Photo", "Home Depot"];

const PLACEMENT_FLAGS: { key: keyof Product; label: string }[] = [
  { key: "isFeaturedHome", label: "الرئيسية — مميز" },
  { key: "isTopPick", label: "الرئيسية — أفضل 10 منتجات" },
  { key: "isFeaturedDeals", label: "العروض — عروض مميزة" },
  { key: "isSaleOff", label: "العروض — تخفيضات" },
  { key: "isTodayDeal", label: "العروض — عرض اليوم" },
  { key: "isNewArrival", label: "وصل حديثاً" },
  { key: "isBestSeller", label: "الأكثر مبيعاً" },
  { key: "isExploreDeal", label: "استكشف — شبكة العروض" },
  { key: "isRecommended", label: "استكشف — موصى به" },
  { key: "isSaved", label: "المختارات المحفوظة" },
  { key: "isSuggested", label: "مقترحات المحرر" },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function ProductForm({
  product,
  availableCategories = [],
  action,
}: {
  product?: Product;
  availableCategories?: SiteCategory[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [priceValue, setPriceValue] = useState(
    product ? (product.priceCents / 100).toFixed(2) : ""
  );

  // Multi-store pricing state
  const initialStores: ArticleStorePrice[] =
    Array.isArray(product?.stores) && product.stores.length > 0
      ? product.stores
      : product?.affiliateUrl
      ? [
          {
            id: generateId(),
            storeName: "Amazon",
            price: product ? `$${(product.priceCents / 100).toFixed(2)}` : "",
            url: product.affiliateUrl,
          },
        ]
      : [{ id: generateId(), storeName: "Amazon", price: "", url: "" }];

  const [stores, setStores] = useState<ArticleStorePrice[]>(initialStores);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function addStore(storeName = "Walmart") {
    setStores([
      ...stores,
      { id: generateId(), storeName, price: priceValue ? `$${priceValue}` : "", url: "" },
    ]);
  }

  function updateStore(index: number, field: keyof ArticleStorePrice, value: string) {
    const updated = [...stores];
    updated[index] = { ...updated[index], [field]: value };
    setStores(updated);

    // If first store's price changes and main price is empty, sync
    if (index === 0 && field === "price") {
      const numMatch = value.replace(/[^0-9.]/g, "");
      if (numMatch && (!priceValue || priceValue === "0" || priceValue === "0.00")) {
        setPriceValue(numMatch);
      }
    }
  }

  function removeStore(index: number) {
    setStores(stores.filter((_, i) => i !== index));
  }

  const validStores = stores.filter(
    (s) => s.storeName.trim() !== "" || s.url.trim() !== "" || s.price.trim() !== ""
  );

  const field =
    "w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lilac bg-white";
  const fieldSm =
    "w-full border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-lilac bg-white";
  const labelCls = "block text-xs font-semibold text-purple-deep mb-1.5";

  return (
    <form action={action} className="flex flex-col gap-6 max-w-3xl pb-12">
      {/* Hidden stores JSON */}
      <input type="hidden" name="stores" value={JSON.stringify(validStores)} />

      {/* Basic Info */}
      <div className="bg-white border border-border rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-deep border-b border-border pb-2.5">
          1. تفاصيل وبيانات المنتج
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="name">
              اسم المنتج *
            </label>
            <input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثال: راوتر TP-Link Archer BE230 Wi-Fi 7"
              className={field}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="slug">
              المعرف في الرابط (Slug) *
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
          <div className="sm:col-span-2">
            <CategorySelectField
              availableCategories={availableCategories}
              initialValue={product?.category}
              label="القسم *"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="subtitle">
              العنوان الفرعي / وسم الترشيح{" "}
              <span className="text-tan-dark font-normal">(مثل: &quot;الأفضل عموماً&quot;، &quot;اختيار المحرر&quot;)</span>
            </label>
            <input
              id="subtitle"
              name="subtitle"
              defaultValue={product?.subtitle ?? ""}
              placeholder="مثال: أفضل راوتر Wi-Fi 7 لمعظم المستخدمين"
              className={field}
            />
          </div>
        </div>
      </div>

      {/* 2. Multi-Store Pricing & Affiliate Links */}
      <div className="bg-white border border-border rounded-xl p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-deep flex items-center gap-2">
              2. الأسعار والمتاجر المتعددة وروابط الأفلييت
            </h2>
            <p className="text-xs text-tan-dark mt-0.5">
              أضف روابط وأسعار المتاجر المتعددة (أمازون، وول مارت، بيست باي، إلخ) لتمكين الزوار من مقارنة الأسعار.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-tan-dark">إضافة سريعة:</span>
            {STORE_SUGGESTIONS.slice(0, 3).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => addStore(st)}
                className="text-[11px] bg-mauve-100 hover:bg-lilac hover:text-white px-2.5 py-1 rounded text-purple-deep transition-colors cursor-pointer"
              >
                +{st}
              </button>
            ))}
            <button
              type="button"
              onClick={() => addStore("Store")}
              className="text-[11px] font-semibold text-rose border border-rose/30 px-2.5 py-1 rounded hover:bg-rose/10 cursor-pointer"
            >
              + متجر آخر
            </button>
          </div>
        </div>

        {stores.length === 0 ? (
          <div className="text-center py-4 bg-mauve-50/40 rounded-lg border border-dashed border-border">
            <p className="text-xs text-tan-dark mb-2">لا توجد روابط متاجر مضافة بعد.</p>
            <button
              type="button"
              onClick={() => addStore("Amazon")}
              className="text-xs font-semibold bg-purple-deep text-white px-3 py-1.5 rounded-lg cursor-pointer"
            >
              + إضافة أول رابط متجر
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-[120px_100px_1fr_32px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-tan-dark">
              <span>اسم المتجر</span>
              <span>السعر ($)</span>
              <span>رابط الأفلييت / الشراء</span>
              <span></span>
            </div>

            {stores.map((st, idx) => (
              <div
                key={st.id || idx}
                className="grid grid-cols-[120px_100px_1fr_32px] gap-2 items-center bg-mauve-50/50 p-2 rounded-lg border border-border"
              >
                <div>
                  <input
                    type="text"
                    value={st.storeName}
                    onChange={(e) => updateStore(idx, "storeName", e.target.value)}
                    placeholder="مثال: Amazon"
                    className={fieldSm}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={st.price}
                    onChange={(e) => updateStore(idx, "price", e.target.value)}
                    placeholder="$49.99"
                    className={fieldSm}
                  />
                </div>
                <div>
                  <input
                    type="url"
                    value={st.url}
                    onChange={(e) => updateStore(idx, "url", e.target.value)}
                    placeholder="https://amazon.com/dp/..."
                    className={fieldSm}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeStore(idx)}
                  className="text-tan-dark hover:text-red-500 text-sm flex items-center justify-center p-1 rounded hover:bg-red-50 cursor-pointer"
                  title="إزالة المتجر"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Primary single affiliate url fallback */}
        <div className="pt-2 border-t border-border/60">
          <label className={labelCls} htmlFor="affiliateUrl">
            رابط الأفلييت الرئيسي <span className="text-tan-dark font-normal">(يتم استخدام أول متجر تلقائياً إذا تُرك فارغاً)</span>
          </label>
          <input
            id="affiliateUrl"
            name="affiliateUrl"
            type="url"
            placeholder="https://www.amazon.com/dp/..."
            defaultValue={product?.affiliateUrl ?? ""}
            className={field}
          />
        </div>
      </div>

      {/* Pricing & Stock Details */}
      <div className="bg-white border border-border rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-deep border-b border-border pb-2.5">
          3. السعر الأساسي والترتيب
        </h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls} htmlFor="price">
              سعر العرض (USD) *
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              placeholder="49.99"
              className={field}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="compareAtPrice">
              السعر قبل الخصم (السابق)
            </label>
            <input
              id="compareAtPrice"
              name="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                product?.compareAtPriceCents != null
                  ? (product.compareAtPriceCents / 100).toFixed(2)
                  : ""
              }
              placeholder="79.99"
              className={field}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="discountPercent">
              نسبة الخصم %
            </label>
            <input
              id="discountPercent"
              name="discountPercent"
              type="number"
              min="0"
              max="100"
              defaultValue={product?.discountPercent ?? ""}
              placeholder="25"
              className={field}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="rank">
              الترتيب في أفضل 10 (#)
            </label>
            <input
              id="rank"
              name="rank"
              type="number"
              min="1"
              defaultValue={product?.rank ?? ""}
              placeholder="1"
              className={field}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="badge">
              الشارة
            </label>
            <input
              id="badge"
              name="badge"
              placeholder="جديد، رائج، أفضل قيمة…"
              defaultValue={product?.badge ?? ""}
              className={field}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="inStock"
              name="inStock"
              type="checkbox"
              defaultChecked={product?.inStock ?? true}
              className="size-4 rounded text-lilac cursor-pointer"
            />
            <label htmlFor="inStock" className="text-sm font-semibold text-purple-deep cursor-pointer">
              متوفر في المخزون
            </label>
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls} htmlFor="rankNote">
              تقييم وملاحظات المحرر{" "}
              <span className="text-tan-dark font-normal">(اختياري)</span>
            </label>
            <textarea
              id="rankNote"
              name="rankNote"
              rows={2}
              defaultValue={product?.rankNote ?? ""}
              placeholder="ملاحظات تجربة واختبار المنتج: سرعة عالية، تغطية ممتازة، إعداد سهل..."
              className={field}
            />
          </div>
        </div>
      </div>

      {/* Photo & Alt text */}
      <div className="bg-white border border-border rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-deep border-b border-border pb-2.5">
          4. صورة المنتج
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="imageLabel">
              النص البديل للصورة
            </label>
            <input
              id="imageLabel"
              name="imageLabel"
              defaultValue={product?.imageLabel ?? ""}
              placeholder="مثال: راوتر TP-Link Archer BE230 على المكتب"
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>الصورة</label>
            <ImageUploadField name="imageUrl" defaultValue={product?.imageUrl} kind="products" />
          </div>
        </div>
      </div>

      {/* Placements */}
      <div className="bg-white border border-border rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-deep">
            5. أماكن العرض وتنسيق الموقع
          </h2>
          <a href="/placements?tab=products" className="text-xs font-semibold text-rose hover:underline">
            مدير أماكن العرض المرئي &larr;
          </a>
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5">
          {PLACEMENT_FLAGS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-purple-deep cursor-pointer"
            >
              <input
                type="checkbox"
                name={key}
                defaultChecked={Boolean(product?.[key])}
                className="size-4 rounded text-lilac"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="bg-lilac hover:bg-lilac/90 text-white rounded-full py-3 px-8 font-semibold text-sm transition-colors shadow-sm cursor-pointer"
        >
          {product ? "حفظ التغييرات" : "إضافة المنتج"}
        </button>
        <a
          href="/products"
          className="text-sm font-semibold text-tan-dark hover:text-purple-deep"
        >
          إلغاء
        </a>
      </div>
    </form>
  );
}
