"use client";

import { useState } from "react";
import { slugify } from "@/lib/slugify";
import ImageUploadField from "@/components/ImageUploadField";
import CategorySelectField from "@/components/CategorySelectField";
import type {
  posts,
  products as productsTable,
  siteCategories,
  ArticleStructuredContent,
  ArticleFeaturedProduct,
  ArticleStorePrice,
  ArticleKeywordLink,
  ArticleCustomSection,
} from "@/db/schema";

type Post = typeof posts.$inferSelect;
type CatalogProduct = typeof productsTable.$inferSelect;
type SiteCategory = typeof siteCategories.$inferSelect;

const STORE_SUGGESTIONS = ["Amazon", "Walmart", "Best Buy", "Target", "eBay", "B&H Photo", "Home Depot"];

const PLACEMENT_FLAGS: { key: keyof Post; label: string }[] = [
  { key: "isHomeSpread", label: "الرئيسية — صندوق المقالات الافتتاحي (أعلى الصفحة)" },
  { key: "isNewHome", label: "الرئيسية — جديد ومحدث" },
  { key: "isHomePreview", label: "الرئيسية — من المدونة" },
  { key: "isHomeReview", label: "الرئيسية — أحدث المراجعات" },
  { key: "isHomeGuide", label: "الرئيسية — دليل الشراء المميز (بانر)" },
  { key: "isRecentBlog", label: "المدونة — أحدث التدوينات" },
  { key: "isSideStory", label: "المدونة — العمود الجانبي" },
  { key: "isDealsPreview", label: "العروض — أحدث المقالات" },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function ArticleForm({
  post,
  availableProducts = [],
  availableCategories = [],
  action,
}: {
  post?: Post;
  availableProducts?: CatalogProduct[];
  availableCategories?: SiteCategory[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");

  // Structured Content States
  const existingStructured: ArticleStructuredContent =
    (post?.structuredContent as ArticleStructuredContent | null) ?? {};

  const [keywordLinks, setKeywordLinks] = useState<ArticleKeywordLink[]>(
    existingStructured.keywordLinks ?? []
  );

  const [productsList, setProductsList] = useState<ArticleFeaturedProduct[]>(
    existingStructured.recommendedProducts ?? []
  );

  const [customSections, setCustomSections] = useState<ArticleCustomSection[]>(
    existingStructured.customSections ?? []
  );

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  // --- Keyword Links Handlers ---
  function addKeywordLink(defaultKeyword = "", defaultUrl = "") {
    setKeywordLinks([...keywordLinks, { keyword: defaultKeyword, url: defaultUrl }]);
  }

  function updateKeywordLink(index: number, field: keyof ArticleKeywordLink, value: string) {
    const updated = [...keywordLinks];
    updated[index] = { ...updated[index], [field]: value };
    setKeywordLinks(updated);
  }

  function removeKeywordLink(index: number) {
    setKeywordLinks(keywordLinks.filter((_, i) => i !== index));
  }

  // --- Product Handlers ---
  function addProduct() {
    const newProd: ArticleFeaturedProduct = {
      id: generateId(),
      name: "",
      subtitle: "",
      imageUrl: "",
      imageLabel: "",
      stores: [{ id: generateId(), storeName: "Amazon", price: "", url: "" }],
      summary: "",
    };
    setProductsList([...productsList, newProd]);
  }

  function handleAddFromCatalog() {
    if (!selectedCatalogId) return;
    const catProd = availableProducts.find((p) => String(p.id) === selectedCatalogId);
    if (!catProd) return;

    let stores: ArticleStorePrice[] = [];
    if (Array.isArray(catProd.stores) && catProd.stores.length > 0) {
      stores = catProd.stores.map((s) => ({
        id: s.id || generateId(),
        storeName: s.storeName,
        price: s.price,
        url: s.url,
      }));
    } else if (catProd.affiliateUrl) {
      stores = [
        {
          id: generateId(),
          storeName: "Amazon",
          price: `$${(catProd.priceCents / 100).toFixed(2)}`,
          url: catProd.affiliateUrl,
        },
      ];
    } else {
      stores = [
        {
          id: generateId(),
          storeName: "Store",
          price: `$${(catProd.priceCents / 100).toFixed(2)}`,
          url: "",
        },
      ];
    }

    const newProd: ArticleFeaturedProduct = {
      id: generateId(),
      name: catProd.name,
      subtitle: catProd.subtitle ?? (catProd.badge ? `${catProd.badge} Pick` : ""),
      imageUrl: catProd.imageUrl ?? "",
      imageLabel: catProd.imageLabel || catProd.name,
      stores,
      summary: catProd.rankNote ?? "",
    };

    setProductsList([...productsList, newProd]);
    setSelectedCatalogId("");

    // Auto-add keyword link if not present and has store URL
    const firstUrl = stores[0]?.url;
    if (firstUrl && !keywordLinks.some((k) => k.keyword.toLowerCase() === catProd.name.toLowerCase())) {
      setKeywordLinks([...keywordLinks, { keyword: catProd.name, url: firstUrl }]);
    }
  }

  function handleFillFromCatalog(index: number, catId: string) {
    const catProd = availableProducts.find((p) => String(p.id) === catId);
    if (!catProd) return;

    let stores: ArticleStorePrice[] = [];
    if (Array.isArray(catProd.stores) && catProd.stores.length > 0) {
      stores = catProd.stores.map((s) => ({
        id: s.id || generateId(),
        storeName: s.storeName,
        price: s.price,
        url: s.url,
      }));
    } else if (catProd.affiliateUrl) {
      stores = [
        {
          id: generateId(),
          storeName: "Amazon",
          price: `$${(catProd.priceCents / 100).toFixed(2)}`,
          url: catProd.affiliateUrl,
        },
      ];
    } else {
      stores = [
        {
          id: generateId(),
          storeName: "Store",
          price: `$${(catProd.priceCents / 100).toFixed(2)}`,
          url: "",
        },
      ];
    }

    const updated = [...productsList];
    updated[index] = {
      ...updated[index],
      name: catProd.name,
      subtitle: catProd.subtitle ?? updated[index].subtitle,
      imageUrl: catProd.imageUrl ?? updated[index].imageUrl,
      imageLabel: catProd.imageLabel || catProd.name,
      stores,
    };
    setProductsList(updated);
  }

  function updateProduct(index: number, field: keyof ArticleFeaturedProduct, value: unknown) {
    const updated = [...productsList];
    updated[index] = { ...updated[index], [field]: value };
    setProductsList(updated);
  }

  function removeProduct(index: number) {
    setProductsList(productsList.filter((_, i) => i !== index));
  }

  function moveProduct(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= productsList.length) return;
    const updated = [...productsList];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setProductsList(updated);
  }

  // Store prices within a product
  function addStorePrice(prodIndex: number, defaultStore = "Walmart") {
    const updated = [...productsList];
    const currentStores = updated[prodIndex].stores || [];
    updated[prodIndex].stores = [
      ...currentStores,
      { id: generateId(), storeName: defaultStore, price: "", url: "" },
    ];
    setProductsList(updated);
  }

  function updateStorePrice(
    prodIndex: number,
    storeIndex: number,
    field: keyof ArticleStorePrice,
    value: string
  ) {
    const updated = [...productsList];
    const stores = [...updated[prodIndex].stores];
    stores[storeIndex] = { ...stores[storeIndex], [field]: value };
    updated[prodIndex].stores = stores;
    setProductsList(updated);
  }

  function removeStorePrice(prodIndex: number, storeIndex: number) {
    const updated = [...productsList];
    updated[prodIndex].stores = updated[prodIndex].stores.filter((_, i) => i !== storeIndex);
    setProductsList(updated);
  }

  // --- Custom Section Handlers ---
  function addCustomSection() {
    const newSection: ArticleCustomSection = {
      id: generateId(),
      title: "",
      imageUrl: "",
      imageLabel: "",
      content: "",
    };
    setCustomSections([...customSections, newSection]);
  }

  function updateCustomSection(index: number, field: keyof ArticleCustomSection, value: string) {
    const updated = [...customSections];
    updated[index] = { ...updated[index], [field]: value };
    setCustomSections(updated);
  }

  function removeCustomSection(index: number) {
    setCustomSections(customSections.filter((_, i) => i !== index));
  }

  function moveCustomSection(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= customSections.length) return;
    const updated = [...customSections];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setCustomSections(updated);
  }

  // Structured content payload object
  const currentStructuredContent: ArticleStructuredContent = {
    keywordLinks: keywordLinks.filter((k) => k.keyword.trim() !== ""),
    recommendedProducts: productsList.filter((p) => p.name.trim() !== ""),
    customSections: customSections.filter((s) => s.title.trim() !== "" || s.content.trim() !== ""),
  };

  const field =
    "w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lilac bg-white";
  const fieldSm =
    "w-full border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-lilac bg-white";
  const labelCls = "block text-xs font-semibold text-purple-deep mb-1.5";

  return (
    <form action={action} className="flex flex-col gap-8 max-w-4xl pb-12">
      {/* Hidden JSON for structured content */}
      <input
        type="hidden"
        name="structuredContent"
        value={JSON.stringify(currentStructuredContent)}
      />

      {/* Basic Metadata */}
      <div className="bg-white border border-border rounded-xl p-5 md:p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-purple-deep border-b border-border pb-3">
          1. البيانات الأساسية والغلاف
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="title">
              عنوان المقال *
            </label>
            <input
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="مثال: أفضل أجهزة الراوتر لعام 2026"
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
              placeholder="best-wifi-routers"
              className={field}
            />
            <p className="text-xs text-tan-dark mt-1">الرابط: /blog/{slug || "…"}</p>
          </div>

          <div className="sm:col-span-2">
            <CategorySelectField
              availableCategories={availableCategories}
              initialValue={post?.category}
              label="القسم *"
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="excerpt">
              الملخص / مقتطف المقال *
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              required
              rows={2}
              defaultValue={post?.excerpt ?? ""}
              placeholder="ملخص موجز أو مقدمة جذابة لهذا الدليل..."
              className={field}
            />
            <p className="text-xs text-tan-dark mt-1">
              يظهر في أعلى المقال، وعلى بطاقات المعاينة، وفي مقتطفات محركات البحث.
            </p>
          </div>

          <div>
            <label className={labelCls} htmlFor="author">
              الكاتب
            </label>
            <input
              id="author"
              name="author"
              defaultValue={post?.author ?? "محرري خزانة ليلك"}
              className={field}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="topicLabel">
              تسمية الموضوع <span className="text-tan-dark font-normal">(اختياري، مثل: &quot;إلكترونيات&quot;)</span>
            </label>
            <input
              id="topicLabel"
              name="topicLabel"
              defaultValue={post?.topicLabel ?? ""}
              className={field}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="imageLabel">
              النص البديل لغلاف المقال
            </label>
            <input
              id="imageLabel"
              name="imageLabel"
              defaultValue={post?.imageLabel ?? ""}
              placeholder="مثال: جهاز راوتر حديث على طاولة خشبية"
              className={field}
            />
          </div>

          <div>
            <label className={labelCls}>صورة الغلاف الرئيسية</label>
            <ImageUploadField name="imageUrl" defaultValue={post?.imageUrl} kind="articles" />
          </div>
        </div>
      </div>

      {/* SECTION 2: Keyword Links */}
      <div className="bg-white border border-border rounded-xl p-5 md:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-semibold text-purple-deep flex items-center gap-2">
              2. الروابط التلقائية للكلمات المفتاحية
            </h2>
            <p className="text-xs text-tan-dark mt-0.5">
              عندما تظهر هذه الكلمات في نصوص المراجعات أو الأقسام المخصصة، تتحول تلقائياً إلى روابط قابلة للنقر.
            </p>
          </div>
          <button
            type="button"
            onClick={() => addKeywordLink()}
            className="self-start sm:self-auto text-xs font-semibold bg-mauve-100 border border-border text-purple-deep hover:bg-lilac hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            + إضافة كلمة مفتاحية
          </button>
        </div>

        {keywordLinks.length === 0 ? (
          <p className="text-xs text-tan-dark italic py-2">
            لا توجد كلمات مفتاحية مضافة بعد. (مثال: &quot;TP-Link Archer BE230&quot; &rarr; https://amazon.com/...)
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {keywordLinks.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 bg-mauve-50/50 p-2.5 rounded-lg border border-border"
              >
                <div className="flex-1 grid sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-tan-dark block mb-0.5">
                      الكلمة / العبارة المفتاحية
                    </label>
                    <input
                      type="text"
                      value={item.keyword}
                      onChange={(e) => updateKeywordLink(idx, "keyword", e.target.value)}
                      placeholder="مثال: TP-Link Archer BE230"
                      className={fieldSm}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-tan-dark block mb-0.5">
                      رابط الوجهة
                    </label>
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => updateKeywordLink(idx, "url", e.target.value)}
                      placeholder="https://amazon.com/..."
                      className={fieldSm}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeKeywordLink(idx)}
                  className="text-tan-dark hover:text-red-500 p-1 rounded mt-3 cursor-pointer"
                  title="إزالة الكلمة المفتاحية"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Everything We Recommend & Product Deep Dives */}
      <div className="bg-white border border-border rounded-xl p-5 md:p-6 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-semibold text-purple-deep flex items-center gap-2">
              3. المنتجات المميزة (ترشيحات المقال)
            </h2>
            <p className="text-xs text-tan-dark mt-0.5">
              اختر منتجات من الكتالوج أو أضف منتجات جديدة مع روابط وأسعار المتاجر المتعددة (أمازون، وول مارت، إلخ).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Catalog Selector */}
            {availableProducts.length > 0 && (
              <div className="flex items-center gap-1.5 bg-mauve-50 p-1.5 rounded-xl border border-border">
                <select
                  value={selectedCatalogId}
                  onChange={(e) => setSelectedCatalogId(e.target.value)}
                  className="text-xs bg-white border border-border rounded-lg px-2.5 py-1.5 text-purple-deep outline-none focus:border-lilac max-w-[200px] truncate"
                >
                  <option value="">اختر من الكتالوج ({availableProducts.length})...</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${(p.priceCents / 100).toFixed(2)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddFromCatalog}
                  disabled={!selectedCatalogId}
                  className="text-xs font-semibold bg-purple-deep hover:bg-lilac disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  + إضافة من الكتالوج
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={addProduct}
              className="text-xs font-semibold bg-mauve-100 hover:bg-lilac hover:text-white border border-border text-purple-deep px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              + منتج فارغ
            </button>
          </div>
        </div>

        {productsList.length === 0 ? (
          <div className="text-center py-8 bg-mauve-50/40 rounded-xl border border-dashed border-border flex flex-col items-center gap-2">
            <p className="text-sm font-medium text-purple-deep">لم يتم إضافة منتجات لهذا المقال بعد.</p>
            <p className="text-xs text-tan-dark max-w-sm">
              اختر منتجاً من قائمة الكتالوج أعلاه أو أضف منتجاً جديداً بأسعار ومتاجر متعددة.
            </p>
            <div className="flex items-center gap-2 mt-2">
              {availableProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (availableProducts[0]) {
                      setSelectedCatalogId(String(availableProducts[0].id));
                    }
                  }}
                  className="text-xs font-semibold bg-purple-deep text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                  اختر من الكتالوج
                </button>
              )}
              <button
                type="button"
                onClick={addProduct}
                className="text-xs font-semibold bg-mauve-100 border border-border text-purple-deep px-4 py-2 rounded-lg cursor-pointer"
              >
                + إضافة منتج فارغ
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {productsList.map((prod, pIdx) => (
              <div
                key={prod.id}
                className="border border-border rounded-xl bg-neutral-50/70 p-4 md:p-5 flex flex-col gap-4 relative"
              >
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-purple-deep text-white text-xs font-bold flex items-center justify-center">
                      {pIdx + 1}
                    </span>
                    <span className="text-sm font-bold text-purple-deep">
                      {prod.name || `المنتج #${pIdx + 1}`}
                    </span>
                    {prod.subtitle && (
                      <span className="text-xs bg-pink-100 text-rose px-2 py-0.5 rounded-full font-medium">
                        {prod.subtitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {availableProducts.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleFillFromCatalog(pIdx, e.target.value);
                        }}
                        defaultValue=""
                        className="text-[11px] bg-white border border-border rounded px-2 py-1 text-tan-dark outline-none focus:border-lilac max-w-[130px] truncate"
                        title="تعبئة البيانات من منتج موجود في الكتالوج"
                      >
                        <option value="">مزامنة مع الكتالوج...</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => moveProduct(pIdx, "up")}
                      disabled={pIdx === 0}
                      className="text-xs px-2 py-1 rounded border border-border bg-white disabled:opacity-30 hover:bg-neutral-100 cursor-pointer"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(pIdx, "down")}
                      disabled={pIdx === productsList.length - 1}
                      className="text-xs px-2 py-1 rounded border border-border bg-white disabled:opacity-30 hover:bg-neutral-100 cursor-pointer"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(pIdx)}
                      className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1 rounded border border-red-200 mr-2 cursor-pointer"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                {/* Main Product Info */}
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelCls}>اسم المنتج *</label>
                    <input
                      type="text"
                      value={prod.name}
                      onChange={(e) => updateProduct(pIdx, "name", e.target.value)}
                      placeholder="مثال: TP-Link Archer BE230"
                      className={field}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>العنوان الفرعي / وسم الترشيح</label>
                    <input
                      type="text"
                      value={prod.subtitle ?? ""}
                      onChange={(e) => updateProduct(pIdx, "subtitle", e.target.value)}
                      placeholder="مثال: أفضل راوتر Wi-Fi 7 بشكل عام"
                      className={field}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>صورة المنتج</label>
                    <ImageUploadField
                      value={prod.imageUrl ?? ""}
                      onChange={(url) => updateProduct(pIdx, "imageUrl", url)}
                      kind="products"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>النص البديل للصورة</label>
                    <input
                      type="text"
                      value={prod.imageLabel ?? ""}
                      onChange={(e) => updateProduct(pIdx, "imageLabel", e.target.value)}
                      placeholder="مثال: منظر أمامي لجهاز TP-Link Archer BE230"
                      className={field}
                    />
                  </div>
                </div>

                {/* Multi-Store Pricing Builder */}
                <div className="bg-white border border-border rounded-lg p-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-purple-deep block">
                        الأسعار والمتاجر المتعددة وروابط الأفلييت
                      </span>
                      <span className="text-[11px] text-tan-dark">
                        أضف الأسعار والروابط لكل متجر (أمازون، وول مارت، بيست باي، إلخ).
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-tan-dark ml-1">إضافة سريعة:</span>
                      {STORE_SUGGESTIONS.slice(0, 3).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => addStorePrice(pIdx, st)}
                          className="text-[11px] bg-mauve-100 hover:bg-lilac hover:text-white px-2 py-0.5 rounded text-purple-deep transition-colors cursor-pointer"
                        >
                          +{st}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => addStorePrice(pIdx, "Store")}
                        className="text-[11px] font-semibold text-rose border border-rose/30 px-2 py-0.5 rounded hover:bg-rose/10 cursor-pointer"
                      >
                        + متجر آخر
                      </button>
                    </div>
                  </div>

                  {prod.stores.length === 0 ? (
                    <p className="text-xs text-tan-dark italic">لم تتم إضافة روابط متاجر بعد.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {prod.stores.map((store, sIdx) => (
                        <div
                          key={store.id || sIdx}
                          className="grid grid-cols-[110px_90px_1fr_auto] gap-2 items-center bg-mauve-50/40 p-2 rounded border border-border"
                        >
                          <div>
                            <input
                              type="text"
                              value={store.storeName}
                              onChange={(e) =>
                                updateStorePrice(pIdx, sIdx, "storeName", e.target.value)
                              }
                              placeholder="المتجر (Amazon)"
                              className={fieldSm}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={store.price}
                              onChange={(e) =>
                                updateStorePrice(pIdx, sIdx, "price", e.target.value)
                              }
                              placeholder="السعر ($99.99)"
                              className={fieldSm}
                            />
                          </div>
                          <div>
                            <input
                              type="url"
                              value={store.url}
                              onChange={(e) =>
                                updateStorePrice(pIdx, sIdx, "url", e.target.value)
                              }
                              placeholder="https://store.com/item-link..."
                              className={fieldSm}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeStorePrice(pIdx, sIdx)}
                            className="text-tan-dark hover:text-red-500 p-1 cursor-pointer"
                            title="إزالة المتجر"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Summary / Review */}
                <div>
                  <label className={labelCls}>
                    نص المراجعة والتقييم المفصل للمنتج
                  </label>
                  <textarea
                    rows={4}
                    value={prod.summary}
                    onChange={(e) => updateProduct(pIdx, "summary", e.target.value)}
                    placeholder="اشرح نتائج الاختبارات، المميزات، العيوب، الأداء، وأهم الملاحظات. افصل بين الفقرات بسطر فارغ."
                    className={`${field} font-sans text-xs leading-relaxed`}
                  />
                  <p className="text-[11px] text-tan-dark mt-1">
                    ملاحظة: أي كلمات مفتاحية تم تعريفها في القسم 2 (مثل أسماء المنتجات) ستتحول تلقائياً إلى روابط قابلة للنقر.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Dynamic Custom Content Sections */}
      <div className="bg-white border border-border rounded-xl p-5 md:p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-semibold text-purple-deep flex items-center gap-2">
              4. الأقسام المخصصة الإضافية
            </h2>
            <p className="text-xs text-tan-dark mt-0.5">
              أضف فقرات وأقسام غير محدودة أسفل مراجعات المنتجات (مثل: كيف اختبرنا المنتجات، نصائح الشراء، الأسئلة الشائعة).
            </p>
          </div>
          <button
            type="button"
            onClick={addCustomSection}
            className="self-start sm:self-auto text-xs font-semibold bg-mauve-100 border border-border text-purple-deep hover:bg-lilac hover:text-white px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            + إضافة قسم
          </button>
        </div>

        {customSections.length === 0 ? (
          <p className="text-xs text-tan-dark italic py-2">
            لم تتم إضافة أقسام مخصصة. يمكنك إضافة أقسام مثل &quot;كيف اختبرنا الأجهزة&quot; أو &quot;دليل الشراء&quot; أو &quot;لمن يناسب هذا المنتج؟&quot;.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {customSections.map((sec, secIdx) => (
              <div
                key={sec.id || secIdx}
                className="border border-border rounded-xl bg-neutral-50/70 p-4 md:p-5 flex flex-col gap-3.5"
              >
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold text-purple-deep uppercase tracking-wider">
                    القسم {secIdx + 1}: {sec.title || "قسم بدون عنوان"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveCustomSection(secIdx, "up")}
                      disabled={secIdx === 0}
                      className="text-xs px-2 py-1 rounded border border-border bg-white disabled:opacity-30 hover:bg-neutral-100 cursor-pointer"
                    >
                      &uarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCustomSection(secIdx, "down")}
                      disabled={secIdx === customSections.length - 1}
                      className="text-xs px-2 py-1 rounded border border-border bg-white disabled:opacity-30 hover:bg-neutral-100 cursor-pointer"
                    >
                      &darr;
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCustomSection(secIdx)}
                      className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1 rounded border border-red-200 mr-2 cursor-pointer"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>عنوان القسم *</label>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => updateCustomSection(secIdx, "title", e.target.value)}
                      placeholder="مثال: كيف اختبرنا أجهزة الراوتر في 2026"
                      className={field}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>صورة القسم (اختياري)</label>
                    <ImageUploadField
                      value={sec.imageUrl ?? ""}
                      onChange={(url) => updateCustomSection(secIdx, "imageUrl", url)}
                      kind="articles"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>النص البديل للصورة</label>
                    <input
                      type="text"
                      value={sec.imageLabel ?? ""}
                      onChange={(e) => updateCustomSection(secIdx, "imageLabel", e.target.value)}
                      placeholder="مثال: إعدادات مختبر الاختبار"
                      className={field}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>محتوى وفقرات القسم</label>
                  <textarea
                    rows={4}
                    value={sec.content}
                    onChange={(e) => updateCustomSection(secIdx, "content", e.target.value)}
                    placeholder="اكتب محتوى القسم هنا. افصل بين الفقرات بسطر فارغ. استخدم **نجمتين** للنص العريض."
                    className={`${field} font-sans text-xs leading-relaxed`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legacy / Full Article Markdown Fallback */}
      <div className="bg-white border border-border rounded-xl p-5 md:p-6">
        <details className="text-sm">
          <summary className="font-semibold text-purple-deep cursor-pointer select-none">
            محتوى الماركداون التقليدي (احتياطي / توافقي)
          </summary>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs text-tan-dark">
              إذا لم يتم إضافة منتجات مهيكلة، سيعرض المقال هذا النص العادي.
            </p>
            <textarea
              id="body"
              name="body"
              rows={8}
              defaultValue={post?.body ?? ""}
              className={`${field} font-mono text-xs leading-relaxed`}
              placeholder="## نص ماركداون اختياري..."
            />
          </div>
        </details>
      </div>

      {/* Publish & Placements */}
      <div className="bg-white border border-border rounded-xl p-5 md:p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-purple-deep border-b border-border pb-3">
          5. النشر وأماكن العرض
        </h2>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-purple-deep cursor-pointer">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={post?.isPublished ?? false}
              className="size-4 rounded text-lilac"
            />
            نشر هذا المقال في الموقع المباشر
          </label>
          <p className="text-xs text-tan-dark mt-1 mr-6">
            اتركه غير محدد لحفظه كمسودة — سيبقى مخفياً عن الزوار حتى يتم نشره.
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-purple-deep uppercase tracking-wide">
              أماكن ظهور المقال في الموقع
            </p>
            <a href="/placements" className="text-xs font-semibold text-rose hover:underline">
              مدير أماكن العرض المرئي &larr;
            </a>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {PLACEMENT_FLAGS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-purple-deep cursor-pointer">
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={Boolean(post?.[key])}
                  className="size-4 rounded text-lilac"
                />
                {label}
              </label>
            ))}
          </div>
          <p className="text-xs text-tan-dark mt-2">
            يظهر كل مقال تلقائياً في شبكة قسمه في /blog. تتيح لك هذه الخيارات ظهوره في أماكن مميزة إضافية.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="bg-lilac hover:bg-lilac/90 text-white rounded-full py-3 px-8 font-semibold text-sm transition-colors shadow-sm cursor-pointer"
        >
          {post ? "حفظ التغييرات" : "إنشاء المقال"}
        </button>
        <a
          href="/articles"
          className="text-sm font-semibold text-tan-dark hover:text-purple-deep"
        >
          إلغاء
        </a>
      </div>
    </form>
  );
}
