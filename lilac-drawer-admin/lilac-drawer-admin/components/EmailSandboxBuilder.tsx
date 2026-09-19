"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { EmailBlock, EmailBlockType, products, posts } from "@/db/schema";
import { generateEmailHtml } from "@/lib/email-generator";
import { saveEmailCampaign, sendEmailCampaign } from "@/lib/email-actions";

type Product = typeof products.$inferSelect;
type Post = typeof posts.$inferSelect;

interface Props {
  initialCampaign?: {
    id?: number;
    title?: string;
    subject?: string;
    previewText?: string;
    senderName?: string;
    blocks?: EmailBlock[];
    status?: string;
  };
  availableProducts: Product[];
  availablePosts: Post[];
  subscriberCount: number;
}

const DEFAULT_BLOCKS: EmailBlock[] = [
  {
    id: "b_header",
    type: "header",
    subtitle: "Weekly Tested Finds & Exclusive Deals",
    direction: "ltr",
    alignment: "center",
  },
  {
    id: "b_hero",
    type: "hero_banner",
    title: "The Ultimate Guide to Wrinkle-Free Travel",
    content: "Discover our editor-tested portable steamers, silk packing cubes, and fabric refreshers that keep your wardrobe flawless on the go.",
    imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop",
    buttonText: "Read the Care Guide",
    buttonUrl: "https://lilacdrawer.com/blog",
    direction: "ltr",
    alignment: "center",
  },
  {
    id: "b_heading_deals",
    type: "heading",
    subtitle: "EDITOR'S TOP PICKS",
    title: "Featured Weekly Deals",
    direction: "ltr",
    alignment: "left",
  },
  {
    id: "b_prod_1",
    type: "product_card",
    productName: "Steamfast SF-717 Compact Iron & Steamer",
    productPrice: "$29.99",
    productComparePrice: "$45.00",
    productBadge: "33% OFF",
    content: "Dual-voltage design with rapid 15-second heating. Tested across 40+ garments with zero scorched silk.",
    imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=600&auto=format&fit=crop",
    productUrl: "https://lilacdrawer.com/deals",
    direction: "ltr",
    alignment: "left",
  },
  {
    id: "b_coupon",
    type: "coupon",
    couponDiscount: "VIP MEMBER SPECIAL",
    couponCode: "LILACVIP15",
    couponNote: "Use at partner checkouts for an extra 15% off through Sunday.",
    direction: "ltr",
    alignment: "center",
  },
  {
    id: "b_footer",
    type: "social_footer",
    direction: "ltr",
    alignment: "center",
  },
];

const TEMPLATE_PRESETS: { name: string; description: string; blocks: EmailBlock[] }[] = [
  {
    name: "عروض وتخفيضات الأسبوع (Weekly Deals - LTR)",
    description: "هيدر مع بانر رئيسي، كرت منتج، كرت مقال، كود خصم وفوتر بتنسيق LTR أنيق.",
    blocks: DEFAULT_BLOCKS,
  },
  {
    name: "نشرة عربية متكاملة (Arabic RTL Editorial)",
    description: "قالب متكامل باللغة العربية مع محاذاة لليمين واتجاه RTL لجميع العناصر.",
    blocks: [
      { id: "b_h_ar", type: "header", subtitle: "نشرة خزانة ليلك الأسبوعية", direction: "rtl", alignment: "center" },
      {
        id: "b_hero_ar",
        type: "hero_banner",
        title: "أفضل منتجات العناية بالملابس التي اختبرها فريقنا",
        content: "اكتشفي معنا الدليل الشامل للأجهزة والحلول العملية لحماية أقمشتك الفاخرة أثناء السفر والاستخدام اليومي.",
        imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop",
        buttonText: "تصفحي الدليل الكامل",
        buttonUrl: "https://lilacdrawer.com/blog",
        direction: "rtl",
        alignment: "center",
      },
      {
        id: "b_hd_ar",
        type: "heading",
        subtitle: "مختارات الأسبوع",
        title: "عروض وتخفيضات حصرية للمشتركين",
        direction: "rtl",
        alignment: "right",
      },
      {
        id: "b_prod_ar",
        type: "product_card",
        productName: "مكواة بخار ستيمفاست المدمجة للسفر",
        productPrice: "$29.99",
        productComparePrice: "$45.00",
        productBadge: "خصم 33%",
        content: "تصميم ثنائي الجهد الكهربائي مع تسخين سريع خلال 15 ثانية، مجربة ومثالية للحرير والأقمشة الحساسة.",
        imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=600&auto=format&fit=crop",
        productUrl: "https://lilacdrawer.com/deals",
        direction: "rtl",
        alignment: "right",
      },
      {
        id: "b_cp_ar",
        type: "coupon",
        couponDiscount: "خصم حصري للأعضاء 15%",
        couponCode: "LILACVIP15",
        couponNote: "استخدمي الكود عند الشراء من المتاجر المعتمدة قبل نهاية الأسبوع.",
        direction: "rtl",
        alignment: "center",
      },
      { id: "b_ft_ar", type: "social_footer", direction: "rtl", alignment: "center" },
    ],
  },
  {
    name: "مقال ومراجعة جديدة (New Article Drop)",
    description: "تركيز على مراجعة تحريرية جديدة مع اقتباسات وزر قراءة المقال.",
    blocks: [
      { id: "b_h2", type: "header", subtitle: "New Editorial Review", direction: "ltr", alignment: "center" },
      {
        id: "b_art",
        type: "article_card",
        articleCategory: "Makeup & Beauty",
        articleTitle: "5 Best Setting Powders for a Seamless Blurred Finish",
        articleExcerpt: "We tested 18 top translucent powders under studio lights and high humidity. Here are the 5 formula winners.",
        imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop",
        articleUrl: "https://lilacdrawer.com/blog",
        direction: "ltr",
        alignment: "left",
      },
      {
        id: "b_txt",
        type: "text",
        content: "Our team tested every formula for flashback, all-day oil control, and cakiness. Read the breakdown to find the perfect shade and texture for your skin type.",
        direction: "ltr",
        alignment: "center",
      },
      { id: "b_btn", type: "button", buttonText: "Explore Full Review", buttonUrl: "https://lilacdrawer.com/blog", buttonStyle: "primary", direction: "ltr", alignment: "center" },
      { id: "b_ft2", type: "social_footer", direction: "ltr", alignment: "center" },
    ],
  },
  {
    name: "إعلان كود خصم حصري (VIP Discount Announcement)",
    description: "كوبون بارز مع تفاصيل العرض وزر تسوق مباشر.",
    blocks: [
      { id: "b_h3", type: "header", subtitle: "Exclusive VIP Perk", direction: "ltr", alignment: "center" },
      { id: "b_hd3", type: "heading", subtitle: "LIMITED TIME", title: "Secret 20% Off Code For Subscribers", direction: "ltr", alignment: "center" },
      { id: "b_cp3", type: "coupon", couponDiscount: "20% OFF EVERYTHING", couponCode: "SECRET20", couponNote: "Valid for 48 hours only across all recommended boutique partners.", direction: "ltr", alignment: "center" },
      { id: "b_txt3", type: "text", content: "Thank you for being part of the Lilac Drawer family. Treat yourself or upgrade your wardrobe essentials today.", direction: "ltr", alignment: "center" },
      { id: "b_btn3", type: "button", buttonText: "Shop Verified Deals Now", buttonUrl: "https://lilacdrawer.com/deals", buttonStyle: "gold", direction: "ltr", alignment: "center" },
      { id: "b_ft3", type: "social_footer", direction: "ltr", alignment: "center" },
    ],
  },
  {
    name: "صفحة بيضاء فارغة (Blank Sandbox)",
    description: "ابنِ رسالتك من الصفر بكل حرية.",
    blocks: [
      { id: "b_h_blank", type: "header", subtitle: "Lilac Drawer Newsletter", direction: "ltr", alignment: "center" },
      { id: "b_hd_blank", type: "heading", title: "Write your heading here", direction: "ltr", alignment: "center" },
      { id: "b_txt_blank", type: "text", content: "Write your email message here...", direction: "ltr", alignment: "center" },
      { id: "b_ft_blank", type: "social_footer", direction: "ltr", alignment: "center" },
    ],
  },
];

export default function EmailSandboxBuilder({
  initialCampaign,
  availableProducts,
  availablePosts,
  subscriberCount,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [campaignId, setCampaignId] = useState<number | undefined>(initialCampaign?.id);
  const [title, setTitle] = useState(initialCampaign?.title || "Weekly Newsletter & Deals");
  const [subject, setSubject] = useState(initialCampaign?.subject || "Your Weekly Picks & Verified Deals — Lilac Drawer");
  const [previewText, setPreviewText] = useState(initialCampaign?.previewText || "Editor tested products, honest reviews, and exclusive member discounts inside.");
  const [senderName, setSenderName] = useState(initialCampaign?.senderName || "Lilac Drawer");
  const [blocks, setBlocks] = useState<EmailBlock[]>(
    initialCampaign?.blocks && initialCampaign.blocks.length > 0
      ? initialCampaign.blocks
      : DEFAULT_BLOCKS
  );

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id || null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile" | "html">("desktop");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Modals state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [sendAllModalOpen, setSendAllModalOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [articlePickerOpen, setArticlePickerOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active selected block
  const selectedBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  // Generated HTML
  const generatedHtml = useMemo(() => {
    return generateEmailHtml(blocks, {
      subject,
      previewText,
      siteUrl: "https://lilacdrawer.com",
    });
  }, [blocks, subject, previewText]);

  // Drag & Drop Handlers
  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
  }

  function handleDrop(index: number) {
    if (draggedIndex === null || draggedIndex === index) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(index, 0, moved);
    setBlocks(newBlocks);
    setDraggedIndex(null);
  }

  // Block Manipulation Handlers
  function addBlock(type: EmailBlockType, afterIndex?: number) {
    const newId = `b_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    let newBlock: EmailBlock = { id: newId, type, direction: "ltr", alignment: "left" };

    switch (type) {
      case "header":
        newBlock.subtitle = "Newsletter & Special Deals";
        newBlock.alignment = "center";
        break;
      case "hero_banner":
        newBlock.title = "Discover Something Extraordinary";
        newBlock.content = "Hand-picked and tested reviews to elevate your daily routine.";
        newBlock.buttonText = "Explore Now";
        newBlock.buttonUrl = "https://lilacdrawer.com";
        newBlock.alignment = "center";
        break;
      case "heading":
        newBlock.title = "Curated Selection";
        newBlock.subtitle = "LATEST ARRIVALS";
        newBlock.alignment = "left";
        break;
      case "text":
        newBlock.content = "Write your editorial note or announcement here.";
        newBlock.alignment = "left";
        break;
      case "product_card":
        newBlock.productName = "Product Title";
        newBlock.productPrice = "$35.00";
        newBlock.productComparePrice = "$50.00";
        newBlock.productBadge = "HOT DEAL";
        newBlock.content = "Brief description of the product and why our editors love it.";
        newBlock.productUrl = "https://lilacdrawer.com/deals";
        newBlock.alignment = "left";
        break;
      case "article_card":
        newBlock.articleCategory = "Reviews & Guides";
        newBlock.articleTitle = "Article Headline Here";
        newBlock.articleExcerpt = "Brief preview of the guide or tested breakdown.";
        newBlock.articleUrl = "https://lilacdrawer.com/blog";
        newBlock.alignment = "left";
        break;
      case "button":
        newBlock.buttonText = "Click Here to Shop";
        newBlock.buttonUrl = "https://lilacdrawer.com";
        newBlock.buttonStyle = "primary";
        newBlock.alignment = "center";
        break;
      case "coupon":
        newBlock.couponDiscount = "EXCLUSIVE 15% OFF";
        newBlock.couponCode = "SAVE15";
        newBlock.couponNote = "Apply at checkout for discount.";
        newBlock.alignment = "center";
        break;
      case "divider":
        break;
      case "social_footer":
        newBlock.alignment = "center";
        break;
    }

    const nextBlocks = [...blocks];
    if (afterIndex !== undefined) {
      nextBlocks.splice(afterIndex + 1, 0, newBlock);
    } else {
      nextBlocks.push(newBlock);
    }

    setBlocks(nextBlocks);
    setSelectedBlockId(newId);
  }

  function removeBlock(id: string) {
    if (blocks.length <= 1) {
      setAlertMessage({ type: "error", text: "يجب أن تحتوي الرسالة على عنصر واحد على الأقل." });
      return;
    }
    const nextBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(nextBlocks);
    if (selectedBlockId === id) {
      setSelectedBlockId(nextBlocks[0]?.id || null);
    }
  }

  function moveBlock(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const nextBlocks = [...blocks];
    const [moved] = nextBlocks.splice(index, 1);
    nextBlocks.splice(targetIndex, 0, moved);
    setBlocks(nextBlocks);
  }

  function duplicateBlock(block: EmailBlock, index: number) {
    const copy: EmailBlock = {
      ...block,
      id: `b_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    const nextBlocks = [...blocks];
    nextBlocks.splice(index + 1, 0, copy);
    setBlocks(nextBlocks);
    setSelectedBlockId(copy.id);
  }

  function updateSelectedBlock(updates: Partial<EmailBlock>) {
    if (!selectedBlockId) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedBlockId ? { ...b, ...updates } : b))
    );
  }

  function applyPreset(preset: typeof TEMPLATE_PRESETS[0]) {
    if (confirm(`هل أنت متأكد من تطبيق قالب "${preset.name}"؟ سيتم استبدال العناصر الحالية.`)) {
      setBlocks(preset.blocks);
      setSelectedBlockId(preset.blocks[0]?.id || null);
    }
  }

  function handleSelectProduct(product: Product) {
    if (!selectedBlockId) return;
    updateSelectedBlock({
      productName: product.name,
      productPrice: `$${(product.priceCents / 100).toFixed(2)}`,
      productComparePrice: product.compareAtPriceCents ? `$${(product.compareAtPriceCents / 100).toFixed(2)}` : undefined,
      productBadge: product.badge || "VERIFIED PICK",
      content: product.subtitle || "Editor-tested quality pick with guaranteed satisfaction.",
      imageUrl: product.imageUrl || undefined,
      productUrl: `https://lilacdrawer.com/deals`,
    });
    setProductPickerOpen(false);
  }

  function handleSelectArticle(post: Post) {
    if (!selectedBlockId) return;
    updateSelectedBlock({
      articleTitle: post.title,
      articleCategory: post.category || "Editorial Guide",
      articleExcerpt: post.excerpt || "Read our in-depth tested findings and expert verdict.",
      imageUrl: post.imageUrl || undefined,
      articleUrl: `https://lilacdrawer.com/blog/${post.slug}`,
    });
    setArticlePickerOpen(false);
  }

  async function handleSave(status: "draft" | "scheduled" = "draft") {
    startTransition(async () => {
      try {
        const res = await saveEmailCampaign({
          id: campaignId,
          title,
          subject,
          previewText,
          senderName,
          blocks,
          status,
        });

        if (res.success && res.campaign) {
          setCampaignId(res.campaign.id);
          setAlertMessage({ type: "success", text: "تم حفظ الحملة بنجاح!" });
          setTimeout(() => setAlertMessage(null), 3500);
        } else {
          setAlertMessage({ type: "error", text: "تعذر حفظ الحملة" });
        }
      } catch (err) {
        setAlertMessage({ type: "error", text: err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الحملة" });
      }
    });
  }

  async function handleSendTest() {
    if (!testEmail || !testEmail.includes("@")) {
      setAlertMessage({ type: "error", text: "يرجى إدخال عنوان بريد إلكتروني صحيح." });
      return;
    }

    startTransition(async () => {
      try {
        let activeId = campaignId;
        if (!activeId) {
          const saveRes = await saveEmailCampaign({
            title,
            subject,
            previewText,
            senderName,
            blocks,
            status: "draft",
          });
          if (saveRes.campaign) {
            activeId = saveRes.campaign.id;
            setCampaignId(activeId);
          }
        }

        if (!activeId) throw new Error("Could not save campaign before sending.");

        const res = await sendEmailCampaign(activeId, { testEmail });
        setTestModalOpen(false);
        setAlertMessage({ type: "success", text: res.message });
      } catch (err) {
        setAlertMessage({ type: "error", text: err instanceof Error ? err.message : "فشل في إرسال البريد التجريبي" });
      }
    });
  }

  async function handleSendBroadcast() {
    startTransition(async () => {
      try {
        let activeId = campaignId;
        if (!activeId) {
          const saveRes = await saveEmailCampaign({
            title,
            subject,
            previewText,
            senderName,
            blocks,
            status: "draft",
          });
          if (saveRes.campaign) {
            activeId = saveRes.campaign.id;
            setCampaignId(activeId);
          }
        }

        if (!activeId) throw new Error("Could not save campaign before sending.");

        const res = await sendEmailCampaign(activeId, { sendToAll: true });
        setSendAllModalOpen(false);
        setAlertMessage({ type: "success", text: res.message });
        router.refresh();
      } catch (err) {
        setAlertMessage({ type: "error", text: err instanceof Error ? err.message : "فشل في إرسال الحملة البريدية" });
      }
    });
  }

  function copyHtmlToClipboard() {
    navigator.clipboard.writeText(generatedHtml);
    setAlertMessage({ type: "success", text: "تم نسخ كود الـ HTML بنجاح إلى الحافظة!" });
    setTimeout(() => setAlertMessage(null), 3000);
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between font-semibold text-xs shadow-sm animate-in fade-in duration-200 ${
            alertMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose/10 border border-rose/30 text-rose"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{alertMessage.type === "success" ? "✓" : "⚠️"}</span>
            <span>{alertMessage.text}</span>
          </div>
          <button type="button" onClick={() => setAlertMessage(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Top Action Header Bar */}
      <div className="bg-white rounded-3xl border border-border p-5 md:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose">
              Email Sandbox & Visual Builder
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-purple-deep">
            مُنشئ وقالب الرسائل البريدية التفاعلي
          </h1>
          <p className="text-xs text-tan-dark">
            صمم رسائل إخبارية أنيقة ومتجاوبة مع دعم كامل للاتجاهين (RTL / LTR) ومحاذاة كل عنصر على حدة.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-end md:self-center">
          <button
            type="button"
            onClick={copyHtmlToClipboard}
            className="px-3.5 py-2 bg-cream-alt hover:bg-mauve-50 text-purple-deep border border-border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>نسخ الـ HTML</span>
            <svg className="w-3.5 h-3.5 text-tan-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>

          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={isPending}
            className="px-4 py-2 bg-white hover:bg-mauve-50 text-purple-deep border border-border rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isPending ? "جاري الحفظ..." : "حفظ مسودة"}
          </button>

          <button
            type="button"
            onClick={() => setTestModalOpen(true)}
            className="px-4 py-2 bg-mauve-100 hover:bg-mauve-200 text-purple-deep rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🧪 إرسال تجريبي</span>
          </button>

          <button
            type="button"
            onClick={() => setSendAllModalOpen(true)}
            className="px-5 py-2 bg-rose hover:bg-purple-deep text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🚀 إرسال إلى {subscriberCount} مشترك</span>
          </button>
        </div>
      </div>

      {/* Campaign Settings Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-border p-4 md:p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-bold text-purple-deep mb-1">عنوان الحملة (داخلي):</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-cream-alt border border-border rounded-xl px-3 py-2 text-purple-deep outline-none focus:border-lilac"
          />
        </div>
        <div>
          <label className="block font-bold text-purple-deep mb-1">عنوان الرسالة (Subject):</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-cream-alt border border-border rounded-xl px-3 py-2 text-purple-deep outline-none focus:border-lilac font-medium"
          />
        </div>
        <div>
          <label className="block font-bold text-purple-deep mb-1">نص المعاينة (Preheader):</label>
          <input
            type="text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="w-full bg-cream-alt border border-border rounded-xl px-3 py-2 text-purple-deep outline-none focus:border-lilac text-tan-dark"
          />
        </div>
      </div>

      {/* Main Sandbox Workspace Layout: 3 Columns (Blocks Palette, Live Canvas, Properties Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Column 1: Block Library Palette & Preset Templates (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Preset Templates Selector */}
          <div className="bg-white rounded-2xl border border-border p-4 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-purple-deep mb-2.5 flex items-center gap-1.5">
              <span>قوالب جاهزة سريعة</span>
            </h3>
            <div className="flex flex-col gap-1.5">
              {TEMPLATE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="w-full text-right p-2.5 rounded-xl border border-border/70 hover:border-lilac hover:bg-mauve-50/70 transition-all text-xs group cursor-pointer"
                >
                  <div className="font-bold text-purple-deep group-hover:text-rose transition-colors">{preset.name}</div>
                  <div className="text-[11px] text-tan-dark mt-0.5 line-clamp-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Add Block Palette */}
          <div className="bg-white rounded-2xl border border-border p-4 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-purple-deep mb-2.5">
              إضافة عناصر للرسالة (+ Blocks)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => addBlock("header")}
                className="p-2.5 rounded-xl border border-border/80 hover:border-lilac hover:bg-mauve-50 text-right flex flex-col gap-1 text-xs font-semibold text-purple-deep transition-all cursor-pointer"
              >
                <span className="text-base">🏷️</span>
                <span>ترويسة وشعار</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("hero_banner")}
                className="p-2.5 rounded-xl border border-border/80 hover:border-lilac hover:bg-mauve-50 text-right flex flex-col gap-1 text-xs font-semibold text-purple-deep transition-all cursor-pointer"
              >
                <span className="text-base">🖼️</span>
                <span>بانر رئيسي</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("heading")}
                className="p-2.5 rounded-xl border border-border/80 hover:border-lilac hover:bg-mauve-50 text-right flex flex-col gap-1 text-xs font-semibold text-purple-deep transition-all cursor-pointer"
              >
                <span className="text-base">📌</span>
                <span>عنوان قسم</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("text")}
                className="p-2.5 rounded-xl border border-border/80 hover:border-lilac hover:bg-mauve-50 text-right flex flex-col gap-1 text-xs font-semibold text-purple-deep transition-all cursor-pointer"
              >
                <span className="text-base">📝</span>
                <span>فقرة نصية</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("product_card")}
                className="p-2.5 rounded-xl border border-border/80 hover:border-lilac hover:bg-mauve-50 text-right flex flex-col gap-1 text-xs font-semibold text-purple-deep transition-all cursor-pointer"
              >
                <span className="text-base">🛍️</span>
                <span>كرت منتج / عرض</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("article_card")}
                className="p-2.5 rounded-xl border border-border/80 hover:border-lilac hover:bg-mauve-50 text-right flex flex-col gap-1 text-xs font-semibold text-purple-deep transition-all cursor-pointer"
              >
                <span className="text-base">📰</span>
                <span>كرت مقال / مراجعة</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("button")}
                className="p-2.5 rounded-xl border border-border/80 hover:border-lilac hover:bg-mauve-50 text-right flex flex-col gap-1 text-xs font-semibold text-purple-deep transition-all cursor-pointer"
              >
                <span className="text-base">🔘</span>
                <span>زر إجراء (CTA)</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("coupon")}
                className="p-2.5 rounded-xl border border-border/80 hover:border-lilac hover:bg-mauve-50 text-right flex flex-col gap-1 text-xs font-semibold text-purple-deep transition-all cursor-pointer"
              >
                <span className="text-base">🎟️</span>
                <span>كوبون خصم</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("divider")}
                className="p-2.5 rounded-xl border border-border/80 hover:border-lilac hover:bg-mauve-50 text-right flex flex-col gap-1 text-xs font-semibold text-purple-deep transition-all cursor-pointer"
              >
                <span className="text-base">➖</span>
                <span>فاصل زخرفي</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock("social_footer")}
                className="p-2.5 rounded-xl border border-border/80 hover:border-lilac hover:bg-mauve-50 text-right flex flex-col gap-1 text-xs font-semibold text-purple-deep transition-all cursor-pointer"
              >
                <span className="text-base">👣</span>
                <span>تذييل وروابط</span>
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Live Canvas Sandbox (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          {/* Canvas View Switcher (Desktop / Mobile / Code) */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-border px-4 py-2.5 shadow-xs">
            <span className="text-xs font-bold text-purple-deep">معاينة الرسالة الحية:</span>
            <div className="flex items-center gap-1 bg-mauve-50 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("desktop")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "desktop" ? "bg-purple-deep text-white shadow-xs" : "text-tan-dark hover:text-purple-deep"
                }`}
              >
                💻 كمبيوتر (600px)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("mobile")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "mobile" ? "bg-purple-deep text-white shadow-xs" : "text-tan-dark hover:text-purple-deep"
                }`}
              >
                📱 جوال (375px)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("html")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "html" ? "bg-purple-deep text-white shadow-xs" : "text-tan-dark hover:text-purple-deep"
                }`}
              >
                &lt;/&gt; كود HTML
              </button>
            </div>
          </div>

          {/* HTML Code View */}
          {viewMode === "html" ? (
            <div className="bg-[#1e1e24] rounded-3xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[700px] border border-black/40" dir="ltr">
              <pre className="whitespace-pre-wrap">{generatedHtml}</pre>
            </div>
          ) : (
            /* Interactive Sandbox Canvas with Drag & Drop */
            <div className="flex justify-center bg-[#eae3dc] rounded-3xl p-4 md:p-8 border border-border shadow-inner min-h-[600px]">
              <div
                className={`transition-all duration-300 bg-white rounded-3xl shadow-xl overflow-hidden border border-border flex flex-col ${
                  viewMode === "mobile" ? "w-[375px]" : "w-full max-w-[600px]"
                }`}
              >
                {/* Simulated Email Client Bar */}
                <div className="bg-mauve-50/80 border-b border-border px-4 py-2 text-[11px] text-tan-dark flex items-center justify-between" dir="ltr">
                  <span>From: {senderName} &lt;newsletter@lilacdrawer.com&gt;</span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-border">Live Preview</span>
                </div>

                {/* Blocks Canvas List */}
                <div className="divide-y divide-border/40">
                  {blocks.map((block, index) => {
                    const isSelected = block.id === selectedBlockId;
                    const blockDir = block.direction || (block.alignment === "right" ? "rtl" : "ltr");
                    const blockAlign = block.alignment || (blockDir === "rtl" ? "right" : blockDir === "ltr" ? "left" : "center");

                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`relative transition-all group/block cursor-pointer ${
                          isSelected
                            ? "ring-2 ring-lilac bg-mauve-50/20 shadow-xs"
                            : "hover:bg-mauve-50/10"
                        }`}
                      >
                        {/* Hover & Active Action Controls for Block */}
                        <div
                          className={`absolute top-2 left-2 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-border rounded-xl shadow-md px-1.5 py-1 text-xs transition-opacity ${
                            isSelected ? "opacity-100" : "opacity-0 group-hover/block:opacity-100"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                          dir="ltr"
                        >
                          <span className="text-[10px] font-bold text-tan-dark px-1 cursor-grab" title="Drag to reorder">
                            ☰
                          </span>
                          <button
                            type="button"
                            onClick={() => moveBlock(index, "up")}
                            disabled={index === 0}
                            className="w-5 h-5 rounded hover:bg-mauve-100 text-purple-deep disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(index, "down")}
                            disabled={index === blocks.length - 1}
                            className="w-5 h-5 rounded hover:bg-mauve-100 text-purple-deep disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateBlock(block, index)}
                            className="w-5 h-5 rounded hover:bg-mauve-100 text-purple-deep cursor-pointer"
                            title="Duplicate"
                          >
                            ⧉
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="w-5 h-5 rounded hover:bg-rose/20 text-rose cursor-pointer"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>

                        {/* Visual Rendered Block Preview */}
                        <div
                          className="p-4 select-none"
                          dir={blockDir}
                          style={{
                            direction: blockDir,
                            textAlign: blockAlign,
                          }}
                        >
                          {block.type === "header" && (
                            <div className="py-4 px-6 bg-gradient-to-r from-mauve-50 via-pink-50/30 to-mauve-50 rounded-xl border border-border/60">
                              <span className="font-heading text-2xl font-bold text-lilac">
                                Lilac <span className="text-gold">Drawer</span>
                              </span>
                              {block.subtitle && (
                                <div className="text-[10px] font-bold uppercase tracking-wider text-rose mt-1">
                                  {block.subtitle}
                                </div>
                              )}
                            </div>
                          )}

                          {block.type === "hero_banner" && (
                            <div className="space-y-3">
                              {block.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={block.imageUrl}
                                  alt="Hero"
                                  className="w-full h-44 object-cover rounded-2xl border border-border"
                                />
                              )}
                              {block.title && (
                                <h2 className="font-heading text-xl font-bold text-purple-deep">
                                  {block.title}
                                </h2>
                              )}
                              {block.content && (
                                <p className="text-xs text-tan-dark leading-relaxed">
                                  {block.content}
                                </p>
                              )}
                              {block.buttonText && (
                                <div className="pt-1">
                                  <span className="inline-block bg-lilac text-white text-xs font-bold px-6 py-2 rounded-full shadow-xs">
                                    {block.buttonText}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {block.type === "heading" && (
                            <div>
                              {block.subtitle && (
                                <div className="text-[10px] font-bold uppercase tracking-wider text-rose">
                                  {block.subtitle}
                                </div>
                              )}
                              <h3 className="font-heading text-lg font-bold text-purple-deep">
                                {block.title || "Section Heading"}
                              </h3>
                              <div className="w-8 h-0.5 bg-lilac rounded-full mt-1 inline-block" />
                            </div>
                          )}

                          {block.type === "text" && (
                            <div className="text-xs text-purple-deep/90 leading-relaxed whitespace-pre-wrap">
                              {block.content || "Write your text here..."}
                            </div>
                          )}

                          {block.type === "product_card" && (
                            <div className={`bg-[#fdfaf7] rounded-2xl border border-border p-3.5 flex items-center gap-3 ${
                              blockDir === "rtl" ? "flex-row" : "flex-row"
                            }`}>
                              {block.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={block.imageUrl}
                                  alt="Product"
                                  className="w-16 h-16 rounded-xl object-contain bg-white border border-border p-1 shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-mauve-100 flex items-center justify-center text-[10px] text-tan shrink-0">
                                  Photo
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                {block.productBadge && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gold text-white uppercase">
                                    {block.productBadge}
                                  </span>
                                )}
                                <div className="text-xs font-bold text-purple-deep truncate mt-0.5">
                                  {block.productName || "Product Name"}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm font-bold text-rose">{block.productPrice || "$0.00"}</span>
                                  {block.productComparePrice && (
                                    <span className="text-[10px] text-tan line-through">{block.productComparePrice}</span>
                                  )}
                                </div>
                              </div>
                              <span className="bg-purple-deep text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shrink-0">
                                {blockDir === "rtl" ? "تفاصيل العرض ←" : "View Deal →"}
                              </span>
                            </div>
                          )}

                          {block.type === "article_card" && (
                            <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
                              {block.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={block.imageUrl}
                                  alt="Article"
                                  className="w-full h-28 object-cover"
                                />
                              )}
                              <div className="p-3.5 space-y-1">
                                {block.articleCategory && (
                                  <span className="text-[10px] font-bold text-rose uppercase tracking-wider">
                                    {block.articleCategory}
                                  </span>
                                )}
                                <div className="font-heading text-sm font-bold text-purple-deep line-clamp-1">
                                  {block.articleTitle || "Article Title"}
                                </div>
                                {block.articleExcerpt && (
                                  <p className="text-[11px] text-tan-dark line-clamp-2 leading-relaxed">
                                    {block.articleExcerpt}
                                  </p>
                                )}
                                <div className="pt-1">
                                  <span className="text-xs font-bold text-rose">
                                    {blockDir === "rtl" ? "قراءة المقال بالكامل ←" : "Read Full Review →"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {block.type === "button" && (
                            <div className="py-2">
                              <span className="inline-block bg-lilac text-white text-xs font-bold px-8 py-2.5 rounded-full shadow-xs">
                                {block.buttonText || "Click Here"}
                              </span>
                            </div>
                          )}

                          {block.type === "coupon" && (
                            <div className="border-2 border-dashed border-lilac bg-pink-50/40 rounded-2xl p-4 text-center space-y-1">
                              {block.couponDiscount && (
                                <div className="text-[10px] font-bold text-rose uppercase tracking-wider">
                                  {block.couponDiscount}
                                </div>
                              )}
                              <div dir="ltr" className="font-mono text-lg font-bold text-purple-deep bg-white border border-border px-3 py-1 rounded-lg inline-block tracking-widest">
                                {block.couponCode || "COUPON15"}
                              </div>
                              {block.couponNote && (
                                <div className="text-[10px] text-tan-dark">{block.couponNote}</div>
                              )}
                            </div>
                          )}

                          {block.type === "divider" && (
                            <div className="py-2 flex items-center justify-center">
                              <div className="w-full h-px bg-border" />
                            </div>
                          )}

                          {block.type === "social_footer" && (
                            <div className="py-4 bg-mauve-50/50 rounded-xl space-y-2 border-t border-border">
                              <div className="font-heading text-sm font-bold text-purple-deep">Lilac Drawer</div>
                              <div className="text-[10px] text-tan-dark">Honest reviews and curated lifestyle recommendations.</div>
                              <div className="text-[10px] text-tan">&copy; {new Date().getFullYear()} Lilac Drawer. All rights reserved.</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Property Inspector & Block Editor Panel (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-border p-4 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-purple-deep mb-3 flex items-center justify-between">
              <span>تعديل العنصر المختار</span>
              {selectedBlock && (
                <span className="text-[10px] font-semibold bg-mauve-100 text-purple-deep px-2 py-0.5 rounded-md uppercase">
                  {selectedBlock.type}
                </span>
              )}
            </h3>

            {!selectedBlock ? (
              <p className="text-xs text-tan-dark text-center py-8">
                انقر على أي عنصر في مساحة العمل لتعديل محتواه واتجاهه ومحاذاته هنا.
              </p>
            ) : (
              <div className="flex flex-col gap-3.5 text-xs">
                
                {/* 1. Direction Control (RTL / LTR) */}
                <div className="p-3 bg-mauve-50/50 rounded-xl border border-border/70">
                  <label className="block font-bold text-purple-deep mb-1.5 flex items-center justify-between">
                    <span>اتجاه النص (Direction):</span>
                    <span className="text-[10px] text-tan-dark font-normal">
                      {selectedBlock.direction === "rtl" ? "يمين إلى يسار (عربي)" : "يسار إلى يمين (English)"}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-lg border border-border/60 text-center font-bold">
                    <button
                      type="button"
                      onClick={() => updateSelectedBlock({ direction: "ltr" })}
                      className={`py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                        (!selectedBlock.direction || selectedBlock.direction === "ltr")
                          ? "bg-purple-deep text-white shadow-2xs"
                          : "text-tan-dark hover:text-purple-deep"
                      }`}
                    >
                      LTR (English)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedBlock({ direction: "rtl" })}
                      className={`py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                        selectedBlock.direction === "rtl"
                          ? "bg-purple-deep text-white shadow-2xs"
                          : "text-tan-dark hover:text-purple-deep"
                      }`}
                    >
                      RTL (عربي)
                    </button>
                  </div>
                </div>

                {/* 2. Text Alignment Control (Left / Center / Right) */}
                <div>
                  <label className="block font-bold text-purple-deep mb-1">المحاذاة (Alignment):</label>
                  <div className="grid grid-cols-3 gap-1 bg-cream-alt p-1 rounded-xl border border-border text-center font-bold">
                    <button
                      type="button"
                      onClick={() => updateSelectedBlock({ alignment: "right" })}
                      className={`py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        selectedBlock.alignment === "right"
                          ? "bg-purple-deep text-white shadow-2xs"
                          : "text-tan-dark hover:text-purple-deep"
                      }`}
                      title="محاذاة لليمين"
                    >
                      يمين
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedBlock({ alignment: "center" })}
                      className={`py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        selectedBlock.alignment === "center"
                          ? "bg-purple-deep text-white shadow-2xs"
                          : "text-tan-dark hover:text-purple-deep"
                      }`}
                      title="محاذاة للوسط"
                    >
                      وسط
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedBlock({ alignment: "left" })}
                      className={`py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        selectedBlock.alignment === "left"
                          ? "bg-purple-deep text-white shadow-2xs"
                          : "text-tan-dark hover:text-purple-deep"
                      }`}
                      title="محاذاة لليسار"
                    >
                      يسار
                    </button>
                  </div>
                </div>

                {/* Title / Heading */}
                {(selectedBlock.type === "header" ||
                  selectedBlock.type === "hero_banner" ||
                  selectedBlock.type === "heading" ||
                  selectedBlock.type === "product_card" ||
                  selectedBlock.type === "article_card") && (
                  <div>
                    <label className="block font-bold text-purple-deep mb-1">
                      {selectedBlock.type === "product_card" ? "اسم المنتج" : selectedBlock.type === "article_card" ? "عنوان المقال" : "العنوان الرئيسي"}
                    </label>
                    <input
                      type="text"
                      dir={selectedBlock.direction || "ltr"}
                      value={selectedBlock.type === "product_card" ? selectedBlock.productName || "" : selectedBlock.type === "article_card" ? selectedBlock.articleTitle || "" : selectedBlock.title || ""}
                      onChange={(e) => {
                        if (selectedBlock.type === "product_card") updateSelectedBlock({ productName: e.target.value });
                        else if (selectedBlock.type === "article_card") updateSelectedBlock({ articleTitle: e.target.value });
                        else updateSelectedBlock({ title: e.target.value });
                      }}
                      className="w-full bg-cream-alt border border-border rounded-xl px-3 py-2 text-purple-deep outline-none focus:border-lilac"
                    />
                  </div>
                )}

                {/* Subtitle / Category Label */}
                {(selectedBlock.type === "header" ||
                  selectedBlock.type === "heading" ||
                  selectedBlock.type === "article_card") && (
                  <div>
                    <label className="block font-bold text-purple-deep mb-1">
                      {selectedBlock.type === "article_card" ? "تصنيف المقال" : "العنوان الفرعي / الوصف"}
                    </label>
                    <input
                      type="text"
                      dir={selectedBlock.direction || "ltr"}
                      value={selectedBlock.type === "article_card" ? selectedBlock.articleCategory || "" : selectedBlock.subtitle || ""}
                      onChange={(e) => {
                        if (selectedBlock.type === "article_card") updateSelectedBlock({ articleCategory: e.target.value });
                        else updateSelectedBlock({ subtitle: e.target.value });
                      }}
                      className="w-full bg-cream-alt border border-border rounded-xl px-3 py-2 text-purple-deep outline-none focus:border-lilac"
                    />
                  </div>
                )}

                {/* Content / Body */}
                {(selectedBlock.type === "hero_banner" ||
                  selectedBlock.type === "text" ||
                  selectedBlock.type === "product_card" ||
                  selectedBlock.type === "article_card") && (
                  <div>
                    <label className="block font-bold text-purple-deep mb-1">المحتوى والنص:</label>
                    <textarea
                      rows={3}
                      dir={selectedBlock.direction || "ltr"}
                      value={selectedBlock.type === "article_card" ? selectedBlock.articleExcerpt || "" : selectedBlock.content || ""}
                      onChange={(e) => {
                        if (selectedBlock.type === "article_card") updateSelectedBlock({ articleExcerpt: e.target.value });
                        else updateSelectedBlock({ content: e.target.value });
                      }}
                      className="w-full bg-cream-alt border border-border rounded-xl px-3 py-2 text-purple-deep outline-none focus:border-lilac leading-relaxed"
                    />
                  </div>
                )}

                {/* Image URL */}
                {(selectedBlock.type === "hero_banner" ||
                  selectedBlock.type === "product_card" ||
                  selectedBlock.type === "article_card") && (
                  <div>
                    <label className="block font-bold text-purple-deep mb-1">رابط الصورة (Image URL):</label>
                    <input
                      type="url"
                      dir="ltr"
                      placeholder="https://..."
                      value={selectedBlock.imageUrl || ""}
                      onChange={(e) => updateSelectedBlock({ imageUrl: e.target.value })}
                      className="w-full bg-cream-alt border border-border rounded-xl px-3 py-2 text-purple-deep outline-none focus:border-lilac text-[11px]"
                    />
                  </div>
                )}

                {/* Product Specific Controls */}
                {selectedBlock.type === "product_card" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-purple-deep mb-1">السعر الحالي:</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={selectedBlock.productPrice || ""}
                          onChange={(e) => updateSelectedBlock({ productPrice: e.target.value })}
                          className="w-full bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-purple-deep outline-none focus:border-lilac"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-purple-deep mb-1">السعر السابق:</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={selectedBlock.productComparePrice || ""}
                          onChange={(e) => updateSelectedBlock({ productComparePrice: e.target.value })}
                          className="w-full bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-purple-deep outline-none focus:border-lilac"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-purple-deep mb-1">شارة الخصم (Badge):</label>
                      <input
                        type="text"
                        placeholder="e.g. 25% OFF"
                        value={selectedBlock.productBadge || ""}
                        onChange={(e) => updateSelectedBlock({ productBadge: e.target.value })}
                        className="w-full bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-purple-deep outline-none focus:border-lilac"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-deep mb-1">رابط العرض / المنتج:</label>
                      <input
                        type="url"
                        dir="ltr"
                        value={selectedBlock.productUrl || ""}
                        onChange={(e) => updateSelectedBlock({ productUrl: e.target.value })}
                        className="w-full bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-purple-deep outline-none focus:border-lilac text-[11px]"
                      />
                    </div>
                    {/* Quick Fill from Store Button */}
                    <button
                      type="button"
                      onClick={() => setProductPickerOpen(true)}
                      className="w-full py-2 bg-pink-100/70 hover:bg-rose hover:text-white text-rose rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 mt-1"
                    >
                      <span>🛍️ اختيار منتج من المتجر تلقائياً</span>
                    </button>
                  </>
                )}

                {/* Article Specific Controls */}
                {selectedBlock.type === "article_card" && (
                  <>
                    <div>
                      <label className="block font-bold text-purple-deep mb-1">رابط المقال:</label>
                      <input
                        type="url"
                        dir="ltr"
                        value={selectedBlock.articleUrl || ""}
                        onChange={(e) => updateSelectedBlock({ articleUrl: e.target.value })}
                        className="w-full bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-purple-deep outline-none focus:border-lilac text-[11px]"
                      />
                    </div>
                    {/* Quick Fill from Blog Button */}
                    <button
                      type="button"
                      onClick={() => setArticlePickerOpen(true)}
                      className="w-full py-2 bg-pink-100/70 hover:bg-rose hover:text-white text-rose rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 mt-1"
                    >
                      <span>📰 اختيار مقال من المدونة تلقائياً</span>
                    </button>
                  </>
                )}

                {/* Button Specific Controls */}
                {(selectedBlock.type === "button" || selectedBlock.type === "hero_banner") && (
                  <>
                    <div>
                      <label className="block font-bold text-purple-deep mb-1">نص الزر:</label>
                      <input
                        type="text"
                        value={selectedBlock.buttonText || ""}
                        onChange={(e) => updateSelectedBlock({ buttonText: e.target.value })}
                        className="w-full bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-purple-deep outline-none focus:border-lilac"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-deep mb-1">رابط الزر (URL):</label>
                      <input
                        type="url"
                        dir="ltr"
                        value={selectedBlock.buttonUrl || ""}
                        onChange={(e) => updateSelectedBlock({ buttonUrl: e.target.value })}
                        className="w-full bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-purple-deep outline-none focus:border-lilac text-[11px]"
                      />
                    </div>
                  </>
                )}

                {/* Coupon Specific Controls */}
                {selectedBlock.type === "coupon" && (
                  <>
                    <div>
                      <label className="block font-bold text-purple-deep mb-1">كود الخصم (Promo Code):</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={selectedBlock.couponCode || ""}
                        onChange={(e) => updateSelectedBlock({ couponCode: e.target.value })}
                        className="w-full bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-purple-deep outline-none focus:border-lilac font-mono uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-deep mb-1">عنوان العرض / نسبة الخصم:</label>
                      <input
                        type="text"
                        value={selectedBlock.couponDiscount || ""}
                        onChange={(e) => updateSelectedBlock({ couponDiscount: e.target.value })}
                        className="w-full bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-purple-deep outline-none focus:border-lilac"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-deep mb-1">ملاحظة / شروط الاستخدام:</label>
                      <input
                        type="text"
                        value={selectedBlock.couponNote || ""}
                        onChange={(e) => updateSelectedBlock({ couponNote: e.target.value })}
                        className="w-full bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-purple-deep outline-none focus:border-lilac text-tan-dark"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Test Email Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-lg font-bold text-purple-deep">إرسال بريد تجريبي (Test Email)</h3>
              <button type="button" onClick={() => setTestModalOpen(false)} className="text-tan-dark hover:text-purple-deep cursor-pointer">✕</button>
            </div>
            <p className="text-xs text-tan-dark leading-relaxed">
              أدخل بريدك الإلكتروني لمعاينة الرسالة الفعلية والتأكد من توافق تصميمها وصورها.
            </p>
            <div>
              <label className="block text-xs font-bold text-purple-deep mb-1">البريد الإلكتروني التجريبي:</label>
              <input
                type="email"
                dir="ltr"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full bg-cream-alt border border-border rounded-xl px-3.5 py-2.5 text-xs text-purple-deep outline-none focus:border-lilac"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-2 bg-cream-alt hover:bg-mauve-50 text-purple-deep rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isPending}
                className="px-5 py-2 bg-purple-deep hover:bg-lilac text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending ? "جاري الإرسال..." : "إرسال التجربة الآن"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Send Broadcast to All Subscribers */}
      {sendAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-lg font-bold text-purple-deep">تأكيد إرسال النشرة البريدية</h3>
              <button type="button" onClick={() => setSendAllModalOpen(false)} className="text-tan-dark hover:text-purple-deep cursor-pointer">✕</button>
            </div>
            <div className="p-4 bg-pink-50/60 border border-rose/20 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-rose">
                سيتم إرسال هذه الرسالة إلى جميع المشتركين المسجلين ({subscriberCount} مشترك):
              </div>
              <div className="text-xs text-purple-deep font-semibold">
                العنوان: &ldquo;{subject}&rdquo;
              </div>
            </div>
            <p className="text-xs text-tan-dark leading-relaxed">
              يرجى التأكد من صحة الروابط والعروض قبل المتابعة. سيتم تسجيل هذه الحملة في سجل الرسائل المرسلة.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSendAllModalOpen(false)}
                className="px-4 py-2 bg-cream-alt hover:bg-mauve-50 text-purple-deep rounded-xl text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={isPending}
                className="px-6 py-2 bg-rose hover:bg-purple-deep text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isPending ? "جاري الإرسال لجميع المشتركين..." : "نعم، أرسل الآن"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Store Product Picker */}
      {productPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-border p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-lg font-bold text-purple-deep">اختر منتجاً من قاعدة بيانات المتجر</h3>
              <button type="button" onClick={() => setProductPickerOpen(false)} className="text-tan-dark hover:text-purple-deep cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {availableProducts.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleSelectProduct(prod)}
                  className="w-full text-right p-3 hover:bg-mauve-50 flex items-center gap-3 transition-colors cursor-pointer rounded-xl"
                >
                  {prod.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={prod.imageUrl} alt={prod.name} className="w-12 h-12 rounded-lg object-contain bg-white border border-border p-1 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-mauve-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-purple-deep truncate">{prod.name}</div>
                    <div className="text-[11px] text-tan-dark">{prod.category} · ${(prod.priceCents / 100).toFixed(2)}</div>
                  </div>
                  <span className="text-xs font-bold text-rose">اختيار &larr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Blog Article Picker */}
      {articlePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-border p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-lg font-bold text-purple-deep">اختر مقالاً من المدونة</h3>
              <button type="button" onClick={() => setArticlePickerOpen(false)} className="text-tan-dark hover:text-purple-deep cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {availablePosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => handleSelectArticle(post)}
                  className="w-full text-right p-3 hover:bg-mauve-50 flex items-center gap-3 transition-colors cursor-pointer rounded-xl"
                >
                  {post.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.imageUrl} alt={post.title} className="w-14 h-12 rounded-lg object-cover bg-white border border-border shrink-0" />
                  ) : (
                    <div className="w-14 h-12 rounded-lg bg-mauve-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-rose uppercase">{post.category}</span>
                    <div className="text-xs font-bold text-purple-deep truncate">{post.title}</div>
                  </div>
                  <span className="text-xs font-bold text-rose">اختيار &larr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
