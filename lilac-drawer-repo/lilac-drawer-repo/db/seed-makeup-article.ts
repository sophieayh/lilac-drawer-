import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { products, posts } from "./schema";
import type { ArticleStructuredContent } from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function seedMakeupArticle() {
  console.log("Seeding Wirecutter-style Makeup article and products...");
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_home_guide boolean DEFAULT false NOT NULL`;

  // 1. Insert/Update Products
  const prod1Slug = "fenty-beauty-pro-filtr-foundation";
  const prod2Slug = "rare-beauty-soft-pinch-liquid-blush";
  const prod3Slug = "charlotte-tilbury-airbrush-setting-spray";

  await db.delete(products).where(eq(products.slug, prod1Slug));
  await db.delete(products).where(eq(products.slug, prod2Slug));
  await db.delete(products).where(eq(products.slug, prod3Slug));

  await db.insert(products).values([
    {
      slug: prod1Slug,
      name: "Fenty Beauty Pro Filt'r Soft Matte Longwear Foundation",
      subtitle: "Best Foundation Overall for 2026",
      category: "Beauty",
      imageLabel: "Fenty Beauty Pro Filt'r Foundation bottle with glass pump",
      imageUrl: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&auto=format&fit=crop&q=80",
      priceCents: 4000,
      compareAtPriceCents: 4500,
      discountPercent: 11,
      rank: 1,
      badge: "EDITOR'S CHOICE",
      rankNote: "Unmatched 59-shade range with an oil-controlling soft-matte finish that lasted 14 hours in testing without settling into fine lines.",
      affiliateUrl: "https://www.sephora.com/product/pro-filtr-soft-matte-longwear-foundation-P87985459",
      stores: [
        { id: "store-f1", storeName: "Sephora", price: "$40.00", url: "https://www.sephora.com/product/pro-filtr-soft-matte-longwear-foundation-P87985459" },
        { id: "store-f2", storeName: "Amazon", price: "$40.00", url: "https://www.amazon.com/dp/B075S1W99S" },
        { id: "store-f3", storeName: "Ulta Beauty", price: "$39.50", url: "https://www.ulta.com/p/pro-filtr-soft-matte-longwear-foundation-pimprod2024508" },
      ],
      isFeaturedHome: true,
      isTopPick: true,
      isFeaturedDeals: true,
      isTodayDeal: true,
      isNewArrival: false,
      isBestSeller: true,
      isRecommended: true,
    },
    {
      slug: prod2Slug,
      name: "Rare Beauty Soft Pinch Liquid Blush",
      subtitle: "Best Long-Wearing Liquid Blush",
      category: "Beauty",
      imageLabel: "Rare Beauty Soft Pinch Liquid Blush bottle with applicator",
      imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
      priceCents: 2300,
      compareAtPriceCents: 2600,
      discountPercent: 12,
      rank: 2,
      badge: "MOST POPULAR",
      rankNote: "A single pin-sized dot provides weightless, all-day color that seamlessly melts into skin without disturbing base makeup.",
      affiliateUrl: "https://www.sephora.com/product/rare-beauty-by-selena-gomez-soft-pinch-liquid-blush-P97989778",
      stores: [
        { id: "store-r1", storeName: "Sephora", price: "$23.00", url: "https://www.sephora.com/product/rare-beauty-by-selena-gomez-soft-pinch-liquid-blush-P97989778" },
        { id: "store-r2", storeName: "Kohl's", price: "$23.00", url: "https://www.kohls.com/product/prd-5694201/rare-beauty-soft-pinch-liquid-blush.jsp" },
        { id: "store-r3", storeName: "Amazon", price: "$24.50", url: "https://www.amazon.com/dp/B08KJ7P3R8" },
      ],
      isFeaturedHome: true,
      isFeaturedDeals: true,
      isBestSeller: true,
      isRecommended: true,
    },
    {
      slug: prod3Slug,
      name: "Charlotte Tilbury Airbrush Flawless Setting Spray",
      subtitle: "Best Setting Spray for All-Day Wear",
      category: "Beauty",
      imageLabel: "Charlotte Tilbury Airbrush Flawless Setting Spray luxury bottle",
      imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
      priceCents: 3800,
      compareAtPriceCents: 4200,
      discountPercent: 10,
      rank: 3,
      badge: "HOLY GRAIL",
      rankNote: "Micro-fine mist locks makeup for 16 hours without stickiness, blurring visible pores and preventing midday T-zone shine.",
      affiliateUrl: "https://www.sephora.com/product/airbrush-flawless-setting-spray-P461147",
      stores: [
        { id: "store-c1", storeName: "Sephora", price: "$38.00", url: "https://www.sephora.com/product/airbrush-flawless-setting-spray-P461147" },
        { id: "store-c2", storeName: "Nordstrom", price: "$38.00", url: "https://www.nordstrom.com/s/charlotte-tilbury-airbrush-flawless-setting-spray/5713437" },
        { id: "store-c3", storeName: "Amazon", price: "$39.99", url: "https://www.amazon.com/dp/B08DT7W8G8" },
      ],
      isFeaturedHome: true,
      isFeaturedDeals: true,
      isTopPick: true,
      isSaved: true,
      isRecommended: true,
    },
  ]);

  // 2. Insert the Article
  const articleSlug = "best-everyday-makeup-essentials";
  await db.delete(posts).where(eq(posts.slug, articleSlug));

  const structuredContent: ArticleStructuredContent = {
    keywordLinks: [
      { keyword: "Fenty Beauty Pro Filt'r", url: "https://www.sephora.com/product/pro-filtr-soft-matte-longwear-foundation-P87985459" },
      { keyword: "Rare Beauty Soft Pinch", url: "https://www.sephora.com/product/rare-beauty-by-selena-gomez-soft-pinch-liquid-blush-P97989778" },
      { keyword: "Charlotte Tilbury Airbrush Setting Spray", url: "https://www.sephora.com/product/airbrush-flawless-setting-spray-P461147" },
      { keyword: "soft-matte finish", url: "https://www.sephora.com/product/pro-filtr-soft-matte-longwear-foundation-P87985459" },
      { keyword: "16-hour lock", url: "https://www.sephora.com/product/airbrush-flawless-setting-spray-P461147" },
    ],
    recommendedProducts: [
      {
        id: "prod-fenty",
        name: "Fenty Beauty Pro Filt'r Soft Matte Longwear Foundation",
        subtitle: "Best Foundation Overall for 2026",
        imageUrl: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&auto=format&fit=crop&q=80",
        imageLabel: "Fenty Beauty Pro Filt'r Foundation bottle with frosted glass finish",
        stores: [
          { id: "st-f1", storeName: "Sephora", price: "$40.00", url: "https://www.sephora.com/product/pro-filtr-soft-matte-longwear-foundation-P87985459" },
          { id: "st-f2", storeName: "Amazon", price: "$40.00", url: "https://www.amazon.com/dp/B075S1W99S" },
          { id: "st-f3", storeName: "Ulta Beauty", price: "$39.50", url: "https://www.ulta.com/p/pro-filtr-soft-matte-longwear-foundation-pimprod2024508" },
        ],
        summary: `After testing 18 liquid and cream foundations across normal, combination, dry, and oily skin types, **Fenty Beauty Pro Filt'r** remains our undisputed top pick for 2026. What separates this formula from dozens of competitors is its climate-adaptive technology: it controls excess sebum in hot, humid weather while refusing to cling to dry winter patches.

The buildable medium-to-full coverage delivers an authentic soft-matte finish that looks remarkably skin-like under natural daylight and studio flash photography alike. In our 14-hour wear trials, testers noted zero oxidation (color deepening) and virtually no creasing around the smile lines or nose bridge.

With 59 inclusive undertone-calibrated shades, virtually every skin tone can find an exact match without mixing. For application, we recommend dispensing 1 to 2 pumps on the back of your hand and blending with a damp beauty sponge for seamless diffusion.`,
      },
      {
        id: "prod-rare",
        name: "Rare Beauty Soft Pinch Liquid Blush",
        subtitle: "Best Long-Wearing Liquid Blush",
        imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
        imageLabel: "Rare Beauty Soft Pinch Liquid Blush tube with doe-foot wand",
        stores: [
          { id: "st-r1", storeName: "Sephora", price: "$23.00", url: "https://www.sephora.com/product/rare-beauty-by-selena-gomez-soft-pinch-liquid-blush-P97989778" },
          { id: "st-r2", storeName: "Kohl's", price: "$23.00", url: "https://www.kohls.com/product/prd-5694201/rare-beauty-soft-pinch-liquid-blush.jsp" },
          { id: "st-r3", storeName: "Amazon", price: "$24.50", url: "https://www.amazon.com/dp/B08KJ7P3R8" },
        ],
        summary: `**Rare Beauty Soft Pinch** has redefined what liquid blush can achieve. Formulated with botanical lotus, gardenia, and white water lily extracts, this weightless pigment delivers a natural, lit-from-within flush that lasts through a full workday, workout, and dinner without fading.

The pigment concentration is exceptional: a single micro-dot tapped onto the apples of the cheeks is all you need for both sides. Unlike traditional powder blushes that can look chalky or settle into texture, this serum-like fluid melts effortlessly over bare skin, tinted moisturizer, or heavy foundation without lifting the base underneath.

Available in both radiant (dewy) and matte finishes, shades like *Hope*, *Joy*, and *Encourage* flatter diverse complexions. Our testers found it works best when blended upward toward the temples using either clean fingertips or a dense synthetic angled brush.`,
      },
      {
        id: "prod-charlotte",
        name: "Charlotte Tilbury Airbrush Flawless Setting Spray",
        subtitle: "Best Setting Spray for All-Day Wear",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
        imageLabel: "Charlotte Tilbury Airbrush Flawless Setting Spray bottle with gold cap",
        stores: [
          { id: "st-c1", storeName: "Sephora", price: "$38.00", url: "https://www.sephora.com/product/airbrush-flawless-setting-spray-P461147" },
          { id: "st-c2", storeName: "Nordstrom", price: "$38.00", url: "https://www.nordstrom.com/s/charlotte-tilbury-airbrush-flawless-setting-spray/5713437" },
          { id: "st-c3", storeName: "Amazon", price: "$39.99", url: "https://www.amazon.com/dp/B08DT7W8G8" },
        ],
        summary: `If you only invest in one finishing product this year, make it **Charlotte Tilbury Airbrush Setting Spray**. While most setting mists merely hydrate or leave a sticky film, this formula features film-forming polymers and aromatic Japanese green tea extract that fuse all powder and liquid layers into a single, transfer-resistant shield.

In our stress tests—which included 85°F humidity chambers and 16-hour long-wear monitoring—makeup locked in with this spray suffered zero melting, smudging, or midday separation. Furthermore, the micro-fine aerosol-like pump distributes an even cloud that never produces large water droplets that ruin eye makeup.

It provides a pore-blurring, satin-smooth finish that cuts unwanted shine without stripping the skin's healthy glow. For maximum longevity, we recommend misting lightly between foundation and powder, followed by a final setting veil once your look is complete.`,
      },
    ],
    customSections: [
      {
        id: "sec-testing",
        title: "How We Tested Makeup in 2026",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
        imageLabel: "Testing laboratory setup with cosmetic swatches and humidity chamber",
        content: `Our beauty editorial team spent three months rigorously evaluating over 40 top-selling cosmetics in controlled environments and real-world daily routines.

We measured four critical performance benchmarks:
1. **Longevity & Transfer Resistance:** Tested over 12-to-16 hour continuous workdays, evaluating phone screen transfers and mask contact.
2. **Climate & Sweat Resilience:** Worn during 45-minute cardiovascular workouts and in simulated high-humidity rooms.
3. **Texture & Skin Compatibility:** Assessed by dermatologists for non-comedogenic compliance on sensitive and acne-prone skin.
4. **Photography Fidelity:** Photographed under direct 5500K daylight, warm indoor lighting, and high-intensity flash to check for flashback or white cast.`,
      },
      {
        id: "sec-guide",
        title: "What to Look for Before You Buy",
        imageUrl: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&auto=format&fit=crop&q=80",
        imageLabel: "Swatching different foundation undertones on skin",
        content: `Choosing the right makeup comes down to understanding your skin's unique behavior rather than chasing social media trends.

**Identify Your Undertone:** Cool undertones look best with pink or blue-based hues, warm undertones glow in golden and peachy shades, while neutral undertones can balance both.

**Formulation Matters:** If you have oily skin, prioritize water-based formulas with oil-absorbing silica. If you have dry skin, look for humectants like hyaluronic acid and glycerin.

**Layering Compatibility:** Ensure your primer, foundation, and concealer share the same base (water-based with water-based, or silicone with silicone) to prevent product separation or pilling throughout the day.`,
      },
      {
        id: "sec-care",
        title: "Hygiene & Care: Keeping Your Makeup Fresh",
        content: `Proper hygiene significantly extends the shelf life of your makeup and prevents skin breakouts:

• **Clean brushes and sponges weekly:** Use a gentle antibacterial soap or brush cleanser to remove trapped oils and bacteria.
• **Avoid direct finger contact:** Dispense liquid products onto palettes or the back of a clean hand rather than dipping fingers into jars.
• **Store in a cool, dry place:** Bathrooms with high steam and temperature swings degrade active cosmetic ingredients faster. Keep your vanity in a bedroom or dedicated vanity drawer.`,
      },
      {
        id: "sec-faq",
        title: "Frequently Asked Questions (FAQ)",
        content: `**Q: Can I wear liquid blush over powder foundation?**
A: We recommend applying liquid and cream blushes *before* your setting powder. If you must apply over powder, use a stippling motion with a damp sponge rather than dragging.

**Q: How long does setting spray actually last?**
A: Charlotte Tilbury Airbrush Setting Spray maintains a 16-hour lock in our tests before minor touch-ups are required on the T-zone.

**Q: Are these products cruelty-free?**
A: Yes, Fenty Beauty, Rare Beauty, and Charlotte Tilbury are all certified cruelty-free brands that do not test on animals.`,
      },
    ],
  };

  await db.insert(posts).values({
    slug: articleSlug,
    title: "The 3 Best Everyday Makeup Essentials of 2026: Tested & Reviewed",
    excerpt: "After 60 hours of wear tests, humidity trials, and dermatologist reviews, these are the 3 essential makeup products worth every dollar in 2026.",
    category: "Beauty & Makeup",
    topicLabel: "Beauty & Cosmetics",
    author: "the Lilac Drawer beauty editors",
    imageLabel: "Curated luxury makeup cosmetics including foundation, liquid blush, and setting spray",
    imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1200&auto=format&fit=crop&q=80",
    structuredContent,
    isPublished: true,
    isHomeSpread: true,
    isNewHome: true,
    isHomePreview: true,
    isHomeReview: true,
    isRecentBlog: true,
    isDealsPreview: true,
    sortOrder: 0,
    publishedAt: new Date(),
  });

  // =========================================================================
  // 2. ARTICLE 2: Best Under-Eye Concealers
  // =========================================================================
  const art2Slug = "best-under-eye-concealers-dark-circles";
  const art2P1Slug = "nars-radiant-creamy-concealer";
  const art2P2Slug = "tarte-shape-tape-full-coverage-concealer";
  const art2P3Slug = "maybelline-instant-age-rewind-concealer";

  await db.delete(posts).where(eq(posts.slug, art2Slug));
  await db.delete(products).where(eq(products.slug, art2P1Slug));
  await db.delete(products).where(eq(products.slug, art2P2Slug));
  await db.delete(products).where(eq(products.slug, art2P3Slug));

  await db.insert(products).values([
    {
      slug: art2P1Slug,
      name: "NARS Radiant Creamy Concealer",
      subtitle: "Best Overall Concealer for All Skin Types",
      category: "Beauty & Makeup",
      imageLabel: "NARS Radiant Creamy Concealer tube with applicator wand",
      imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
      priceCents: 3200,
      compareAtPriceCents: 3600,
      discountPercent: 11,
      rank: 1,
      badge: "BEST OVERALL",
      rankNote: "Luminous, buildable medium-to-full coverage that never cakes or settles into fine lines during 12-hour wear.",
      affiliateUrl: "https://www.sephora.com/product/radiant-creamy-concealer-P377873",
      stores: [
        { id: "s-nars-1", storeName: "Sephora", price: "$32.00", url: "https://www.sephora.com/product/radiant-creamy-concealer-P377873" },
        { id: "s-nars-2", storeName: "Ulta Beauty", price: "$32.00", url: "https://www.ulta.com/p/radiant-creamy-concealer-xlsImpprod10251007" },
        { id: "s-nars-3", storeName: "Amazon", price: "$31.50", url: "https://www.amazon.com/dp/B00C164R54" },
      ],
      isFeaturedHome: true,
      isTopPick: true,
      isTodayDeal: true,
      isRecommended: true,
    },
    {
      slug: art2P2Slug,
      name: "Tarte Shape Tape Full Coverage Concealer",
      subtitle: "Best Full Coverage for Blemishes & Dark Circles",
      category: "Beauty & Makeup",
      imageLabel: "Tarte Shape Tape concealer bottle with jumbo applicator",
      imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
      priceCents: 3100,
      compareAtPriceCents: 3500,
      discountPercent: 11,
      rank: 2,
      badge: "MAX COVERAGE",
      rankNote: "High-pigment matte formula with tape technology that smooths skin texture and instantly erases intense pigmentation.",
      affiliateUrl: "https://www.ulta.com/p/shape-tape-full-coverage-concealer-xlsImpprod14251035",
      stores: [
        { id: "s-tarte-1", storeName: "Ulta Beauty", price: "$31.00", url: "https://www.ulta.com/p/shape-tape-full-coverage-concealer-xlsImpprod14251035" },
        { id: "s-tarte-2", storeName: "Target", price: "$31.00", url: "https://www.target.com/p/tarte-shape-tape" },
        { id: "s-tarte-3", storeName: "Amazon", price: "$32.00", url: "https://www.amazon.com/dp/B0797YFMDV" },
      ],
      isFeaturedDeals: true,
      isRecommended: true,
    },
    {
      slug: art2P3Slug,
      name: "Maybelline Instant Age Rewind Multi-Use Concealer",
      subtitle: "Best Budget Concealer for Quick Everyday Touch-Ups",
      category: "Beauty & Makeup",
      imageLabel: "Maybelline Instant Age Rewind concealer with micro-cushion sponge",
      imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
      priceCents: 1099,
      compareAtPriceCents: 1399,
      discountPercent: 21,
      rank: 3,
      badge: "BEST VALUE",
      rankNote: "Haloxyl-infused micro-cushion applicator instantly brightens tired undereyes with lightweight, blendable hydration.",
      affiliateUrl: "https://www.amazon.com/dp/B004Y9G9AW",
      stores: [
        { id: "s-mayb-1", storeName: "Amazon", price: "$10.99", url: "https://www.amazon.com/dp/B004Y9G9AW" },
        { id: "s-mayb-2", storeName: "Walmart", price: "$10.48", url: "https://www.walmart.com/ip/Maybelline-Instant-Age-Rewind/19888497" },
        { id: "s-mayb-3", storeName: "Ulta Beauty", price: "$11.99", url: "https://www.ulta.com/p/instant-age-rewind-eraser-treatment-concealer-xlsImpprod3490149" },
      ],
      isSaleOff: true,
      isRecommended: true,
    },
  ]);

  await db.insert(posts).values({
    slug: art2Slug,
    title: "The Best Under-Eye Concealers for Dark Circles and Blemishes in 2026",
    excerpt: "We tested 22 liquid and cream concealers across diverse skin tones and textures. These 3 concealers deliver crease-proof, all-day coverage without caking.",
    category: "Beauty & Makeup",
    topicLabel: "Concealers & Complexion",
    author: "the Lilac Drawer beauty editors",
    imageLabel: "Testing various concealer swatches on skin",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&auto=format&fit=crop&q=80",
    structuredContent: {
      keywordLinks: [
        { keyword: "NARS Radiant Creamy Concealer", url: "https://www.sephora.com/product/radiant-creamy-concealer-P377873" },
        { keyword: "Tarte Shape Tape", url: "https://www.ulta.com/p/shape-tape-full-coverage-concealer-xlsImpprod14251035" },
        { keyword: "Maybelline Age Rewind", url: "https://www.amazon.com/dp/B004Y9G9AW" },
      ],
      recommendedProducts: [
        {
          id: "rec-nars",
          name: "NARS Radiant Creamy Concealer",
          subtitle: "Best Overall Concealer for All Skin Types",
          imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
          imageLabel: "NARS Radiant Creamy Concealer tube with applicator wand",
          stores: [
            { id: "st-n1", storeName: "Sephora", price: "$32.00", url: "https://www.sephora.com/product/radiant-creamy-concealer-P377873" },
            { id: "st-n2", storeName: "Ulta Beauty", price: "$32.00", url: "https://www.ulta.com/p/radiant-creamy-concealer-xlsImpprod10251007" },
            { id: "st-n3", storeName: "Amazon", price: "$31.50", url: "https://www.amazon.com/dp/B00C164R54" },
          ],
          summary: "NARS Radiant Creamy Concealer has been the gold standard for over a decade because of its radiant, skin-like finish that never looks cakey. In our testing on dry and mature undereyes, it resisted settling into fine lines for 12 hours straight without requiring heavy powder baking.",
        },
        {
          id: "rec-tarte",
          name: "Tarte Shape Tape Full Coverage Concealer",
          subtitle: "Best Full Coverage for Blemishes & Dark Circles",
          imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
          imageLabel: "Tarte Shape Tape concealer bottle with jumbo applicator",
          stores: [
            { id: "st-t1", storeName: "Ulta Beauty", price: "$31.00", url: "https://www.ulta.com/p/shape-tape-full-coverage-concealer-xlsImpprod14251035" },
            { id: "st-t2", storeName: "Target", price: "$31.00", url: "https://www.target.com/p/tarte-shape-tape" },
          ],
          summary: "When you need maximum opacity for dark under-eye circles or redness, Tarte Shape Tape provides unbeatable pigmented power. Formulated with shea butter and mango seed butter, a single dab effortlessly blanks out discoloration without shifting throughout long workdays.",
        },
        {
          id: "rec-maybelline",
          name: "Maybelline Instant Age Rewind Multi-Use Concealer",
          subtitle: "Best Budget Concealer for Quick Everyday Touch-Ups",
          imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
          imageLabel: "Maybelline Instant Age Rewind concealer with micro-cushion sponge",
          stores: [
            { id: "st-m1", storeName: "Amazon", price: "$10.99", url: "https://www.amazon.com/dp/B004Y9G9AW" },
            { id: "st-m2", storeName: "Walmart", price: "$10.48", url: "https://www.walmart.com/ip/Maybelline-Instant-Age-Rewind/19888497" },
          ],
          summary: "At roughly one-third the price of prestige options, Maybelline Age Rewind punches well above its weight. Its featherlight formula infused with goji berry extract brightens shadowy corners of the eyes and smooths crow's feet with minimal blending required.",
        },
      ],
      customSections: [
        {
          id: "sec-conc-testing",
          title: "How We Tested Concealers",
          content: "We applied each formula to 14 volunteer testers across diverse skin types (dry, normal, combination, and oily) in a temperature-controlled studio. We checked for oxidation, creasing under magnification lenses after 4, 8, and 12 hours, and evaluated how easily each blended over different sunscreens and eye creams.",
        },
        {
          id: "sec-conc-guide",
          title: "Choosing Between Hydrating vs. Matte Concealers",
          content: "For undereye darkness, hydrating or satin formulas reflect light and disguise hollows without accentuating dry patches. For blemishes and hyperpigmentation on the cheeks or forehead, matte, high-adhesion formulas stay in place and blur texture effectively.",
        },
      ],
    },
    isPublished: true,
    isHomeSpread: true,
    isHomeReview: true,
    isRecentBlog: true,
    publishedAt: new Date(Date.now() - 3600 * 1000 * 2),
  });

  // =========================================================================
  // 3. ARTICLE 3: Best Mascaras
  // =========================================================================
  const art3Slug = "best-mascaras-volume-length-zero-smudge";
  const art3P1Slug = "lancome-lash-idole-volumizing-mascara";
  const art3P2Slug = "loreal-telescopic-lift-mascara";
  const art3P3Slug = "ilia-limitless-lash-clean-mascara";

  await db.delete(posts).where(eq(posts.slug, art3Slug));
  await db.delete(products).where(eq(products.slug, art3P1Slug));
  await db.delete(products).where(eq(products.slug, art3P2Slug));
  await db.delete(products).where(eq(products.slug, art3P3Slug));

  await db.insert(products).values([
    {
      slug: art3P1Slug,
      name: "Lancôme Lash Idôle Lash-Lifting & Volumizing Mascara",
      subtitle: "Best Overall Mascara for Clump-Free Lift",
      category: "Beauty & Makeup",
      imageLabel: "Lancôme Lash Idôle curved wand with micro-bristles",
      imageUrl: "https://images.unsplash.com/photo-1587754256282-a11d04e3472d?w=800&auto=format&fit=crop&q=80",
      priceCents: 3000,
      compareAtPriceCents: 3400,
      discountPercent: 12,
      rank: 1,
      badge: "EDITOR'S TOP PICK",
      rankNote: "Curved elastomeric wand with 360 micro-bristles fans out lashes without clumping or flaking over 14 hours.",
      affiliateUrl: "https://www.sephora.com/product/lash-idole-mascara-P467946",
      stores: [
        { id: "s-lanc-1", storeName: "Sephora", price: "$30.00", url: "https://www.sephora.com/product/lash-idole-mascara-P467946" },
        { id: "s-lanc-2", storeName: "Nordstrom", price: "$30.00", url: "https://www.nordstrom.com/s/lancome-lash-idole/5812345" },
        { id: "s-lanc-3", storeName: "Amazon", price: "$29.50", url: "https://www.amazon.com/dp/B08P1QMD7B" },
      ],
      isFeaturedHome: true,
      isTopPick: true,
      isRecommended: true,
    },
    {
      slug: art3P2Slug,
      name: "L'Oréal Paris Telescopic Lift Washable Mascara",
      subtitle: "Best Drugstore Mascara for Extreme Length",
      category: "Beauty & Makeup",
      imageLabel: "L'Oreal Telescopic Lift double-hook bristle wand",
      imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
      priceCents: 1499,
      compareAtPriceCents: 1799,
      discountPercent: 17,
      rank: 2,
      badge: "DRUGSTORE ICON",
      rankNote: "Exclusive double-hook bristles grab and separate every tiny eyelash, adding up to 5mm of visible length.",
      affiliateUrl: "https://www.amazon.com/dp/B0BNW85N42",
      stores: [
        { id: "s-lor-1", storeName: "Amazon", price: "$14.99", url: "https://www.amazon.com/dp/B0BNW85N42" },
        { id: "s-lor-2", storeName: "Target", price: "$14.99", url: "https://www.target.com/p/loreal-telescopic-lift" },
        { id: "s-lor-3", storeName: "Ulta Beauty", price: "$15.49", url: "https://www.ulta.com/p/telescopic-lift-washable-mascara-pimprod2036495" },
      ],
      isFeaturedDeals: true,
      isRecommended: true,
    },
    {
      slug: art3P3Slug,
      name: "ILIA Limitless Lash Clean Lengthening Mascara",
      subtitle: "Best Clean Beauty Mascara for Sensitive Eyes",
      category: "Beauty & Makeup",
      imageLabel: "ILIA Limitless Lash dual-sided organic mascara",
      imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
      priceCents: 2800,
      compareAtPriceCents: 3000,
      discountPercent: 7,
      rank: 3,
      badge: "CLEAN BEAUTY",
      rankNote: "Ophthalmologist-tested beeswax and organic shea butter formula safe for contact lens wearers with zero irritation.",
      affiliateUrl: "https://www.sephora.com/product/limitless-lash-mascara-P431752",
      stores: [
        { id: "s-ilia-1", storeName: "Sephora", price: "$28.00", url: "https://www.sephora.com/product/limitless-lash-mascara-P431752" },
        { id: "s-ilia-2", storeName: "Credo Beauty", price: "$28.00", url: "https://credobeauty.com/products/limitless-lash-mascara" },
      ],
      isRecommended: true,
    },
  ]);

  await db.insert(posts).values({
    slug: art3Slug,
    title: "The Best Mascaras for Dramatic Volume, Length, and Zero Smudging",
    excerpt: "From drugstore classics to prestige formulas, we put 19 mascaras through humidity chambers and 14-hour wear tests to find the absolute best wand for your lashes.",
    category: "Beauty & Makeup",
    topicLabel: "Eye Makeup",
    author: "the Lilac Drawer beauty editors",
    imageLabel: "Luxury mascara wand and packaging",
    imageUrl: "https://images.unsplash.com/photo-1587754256282-a11d04e3472d?w=1200&auto=format&fit=crop&q=80",
    structuredContent: {
      keywordLinks: [
        { keyword: "Lancôme Lash Idôle", url: "https://www.sephora.com/product/lash-idole-mascara-P467946" },
        { keyword: "L'Oréal Telescopic Lift", url: "https://www.amazon.com/dp/B0BNW85N42" },
        { keyword: "ILIA Limitless Lash", url: "https://www.sephora.com/product/limitless-lash-mascara-P431752" },
      ],
      recommendedProducts: [
        {
          id: "rec-lancome",
          name: "Lancôme Lash Idôle Lash-Lifting & Volumizing Mascara",
          subtitle: "Best Overall Mascara for Clump-Free Lift",
          imageUrl: "https://images.unsplash.com/photo-1587754256282-a11d04e3472d?w=800&auto=format&fit=crop&q=80",
          imageLabel: "Lancôme Lash Idôle curved wand with micro-bristles",
          stores: [
            { id: "st-l1", storeName: "Sephora", price: "$30.00", url: "https://www.sephora.com/product/lash-idole-mascara-P467946" },
            { id: "st-l2", storeName: "Nordstrom", price: "$30.00", url: "https://www.nordstrom.com/s/lancome-lash-idole/5812345" },
          ],
          summary: "Lancôme Lash Idôle earned top scores across our entire testing panel for its ability to separate and fan lashes with zero clumping. The lightweight gel emulsion coats lashes evenly from root to tip, maintaining a soft, touchable curl throughout long workdays.",
        },
        {
          id: "rec-loreal",
          name: "L'Oréal Paris Telescopic Lift Washable Mascara",
          subtitle: "Best Drugstore Mascara for Extreme Length",
          imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
          imageLabel: "L'Oreal Telescopic Lift double-hook bristle wand",
          stores: [
            { id: "st-lo1", storeName: "Amazon", price: "$14.99", url: "https://www.amazon.com/dp/B0BNW85N42" },
            { id: "st-lo2", storeName: "Target", price: "$14.99", url: "https://www.target.com/p/loreal-telescopic-lift" },
          ],
          summary: "L'Oréal Telescopic Lift delivers breathtaking extension that mimics the look of salon lash extensions. The innovative paddle-shaped brush features load hooks that deposit formula and comb hooks that separate each individual hair.",
        },
        {
          id: "rec-ilia",
          name: "ILIA Limitless Lash Clean Lengthening Mascara",
          subtitle: "Best Clean Beauty Mascara for Sensitive Eyes",
          imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
          imageLabel: "ILIA Limitless Lash dual-sided organic mascara",
          stores: [
            { id: "st-il1", storeName: "Sephora", price: "$28.00", url: "https://www.sephora.com/product/limitless-lash-mascara-P431752" },
          ],
          summary: "If your eyes water easily or you wear contact lenses, ILIA Limitless Lash is a lifesaver. Enriched with arginine and organic shea butter, this clean formula conditions lash health while removing effortlessly with warm water at night.",
        },
      ],
      customSections: [
        {
          id: "sec-masc-testing",
          title: "How We Tested Smudge Resistance",
          content: "We conducted workout sweat tests and 80-degree sauna room simulations to monitor racoon eyes, flaking on the lower lash line, and ease of makeup removal with micellar water.",
        },
      ],
    },
    isPublished: true,
    isHomeReview: true,
    isRecentBlog: true,
    publishedAt: new Date(Date.now() - 3600 * 1000 * 4),
  });

  // =========================================================================
  // 4. ARTICLE 4: Best Long-Lasting Lipsticks & Balms
  // =========================================================================
  const art4Slug = "best-long-lasting-lipsticks-hydrating-lip-balms";
  const art4P1Slug = "mac-retro-matte-lipstick-ruby-woo";
  const art4P2Slug = "summer-fridays-lip-butter-balm";
  const art4P3Slug = "dior-addict-lip-glow-balm";

  await db.delete(posts).where(eq(posts.slug, art4Slug));
  await db.delete(products).where(eq(products.slug, art4P1Slug));
  await db.delete(products).where(eq(products.slug, art4P2Slug));
  await db.delete(products).where(eq(products.slug, art4P3Slug));

  await db.insert(products).values([
    {
      slug: art4P1Slug,
      name: "MAC Retro Matte Lipstick in Ruby Woo",
      subtitle: "The Timeless Long-Wear Iconic Red",
      category: "Beauty & Makeup",
      imageLabel: "MAC iconic bullet lipstick in Ruby Woo matte crimson",
      imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80",
      priceCents: 2300,
      compareAtPriceCents: 2600,
      discountPercent: 11,
      rank: 1,
      badge: "TIMELESS ICON",
      rankNote: "Ultra-pigmented true blue-red that flatters every skin tone and survives meals, coffee, and 8 hours of wear.",
      affiliateUrl: "https://www.ulta.com/p/retro-matte-lipstick-xlsImpprod15921192",
      stores: [
        { id: "s-mac-1", storeName: "Ulta Beauty", price: "$23.00", url: "https://www.ulta.com/p/retro-matte-lipstick-xlsImpprod15921192" },
        { id: "s-mac-2", storeName: "Nordstrom", price: "$23.00", url: "https://www.nordstrom.com/s/mac-retro-matte-lipstick/3141151" },
        { id: "s-mac-3", storeName: "Amazon", price: "$22.50", url: "https://www.amazon.com/dp/B0006LNE56" },
      ],
      isFeaturedHome: true,
      isTopPick: true,
      isRecommended: true,
    },
    {
      slug: art4P2Slug,
      name: "Summer Fridays Lip Butter Balm in Vanilla Beige",
      subtitle: "Best Hydrating Daily Lip Butter & Gloss",
      category: "Beauty & Makeup",
      imageLabel: "Summer Fridays Lip Butter Balm pastel aesthetic tube",
      imageUrl: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&auto=format&fit=crop&q=80",
      priceCents: 2400,
      compareAtPriceCents: 2600,
      discountPercent: 8,
      rank: 2,
      badge: "VIRAL FAVORITE",
      rankNote: "100% vegan shea and murumuru seed butters provide instant soothing moisture with a non-sticky caramel sheen.",
      affiliateUrl: "https://www.sephora.com/product/summer-fridays-lip-butter-balm-P455936",
      stores: [
        { id: "s-sf-1", storeName: "Sephora", price: "$24.00", url: "https://www.sephora.com/product/summer-fridays-lip-butter-balm-P455936" },
        { id: "s-sf-2", storeName: "Kohl's", price: "$24.00", url: "https://www.kohls.com/product/prd-5899999/summer-fridays-lip-butter.jsp" },
      ],
      isFeaturedDeals: true,
      isRecommended: true,
    },
    {
      slug: art4P3Slug,
      name: "Dior Addict Lip Glow Color-Reviving Balm",
      subtitle: "Best Luxury Custom pH Color-Enhancing Lip Balm",
      category: "Beauty & Makeup",
      imageLabel: "Dior Lip Glow pink luxury couture packaging",
      imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
      priceCents: 4000,
      compareAtPriceCents: 4500,
      discountPercent: 11,
      rank: 3,
      badge: "LUXURY PICK",
      rankNote: "Color Reviver technology reacts with your lips' natural pH to deliver a bespoke, glowing rosy flush for 24 hours.",
      affiliateUrl: "https://www.sephora.com/product/dior-addict-lip-glow-color-reviving-lip-balm-P236816",
      stores: [
        { id: "s-dior-1", storeName: "Sephora", price: "$40.00", url: "https://www.sephora.com/product/dior-addict-lip-glow-color-reviving-lip-balm-P236816" },
        { id: "s-dior-2", storeName: "Nordstrom", price: "$40.00", url: "https://www.nordstrom.com/s/dior-addict-lip-glow/2972985" },
      ],
      isRecommended: true,
    },
  ]);

  await db.insert(posts).values({
    slug: art4Slug,
    title: "The Best Long-Lasting Lipsticks and Hydrating Lip Balms of 2026",
    excerpt: "We evaluated 30 lip colors for pigment payoff, transfer resistance, and all-day hydration. These 3 stand out as our editor-approved daily staples.",
    category: "Beauty & Makeup",
    topicLabel: "Lip Care & Color",
    author: "the Lilac Drawer beauty editors",
    imageLabel: "Collection of luxury matte and satin lipsticks",
    imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=1200&auto=format&fit=crop&q=80",
    structuredContent: {
      keywordLinks: [
        { keyword: "MAC Ruby Woo", url: "https://www.ulta.com/p/retro-matte-lipstick-xlsImpprod15921192" },
        { keyword: "Summer Fridays Lip Butter", url: "https://www.sephora.com/product/summer-fridays-lip-butter-balm-P455936" },
        { keyword: "Dior Lip Glow", url: "https://www.sephora.com/product/dior-addict-lip-glow-color-reviving-lip-balm-P236816" },
      ],
      recommendedProducts: [
        {
          id: "rec-mac",
          name: "MAC Retro Matte Lipstick in Ruby Woo",
          subtitle: "The Timeless Long-Wear Iconic Red",
          imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80",
          imageLabel: "MAC iconic bullet lipstick in Ruby Woo matte crimson",
          stores: [
            { id: "st-mc1", storeName: "Ulta Beauty", price: "$23.00", url: "https://www.ulta.com/p/retro-matte-lipstick-xlsImpprod15921192" },
            { id: "st-mc2", storeName: "Nordstrom", price: "$23.00", url: "https://www.nordstrom.com/s/mac-retro-matte-lipstick/3141151" },
          ],
          summary: "MAC's legendary Ruby Woo remains the highest-rated matte lipstick in our testing database. The vivid, blue-red hue creates an instant teeth-whitening effect and clings securely to lips without feathering outside the vermilion border.",
        },
        {
          id: "rec-sf",
          name: "Summer Fridays Lip Butter Balm in Vanilla Beige",
          subtitle: "Best Hydrating Daily Lip Butter & Gloss",
          imageUrl: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&auto=format&fit=crop&q=80",
          imageLabel: "Summer Fridays Lip Butter Balm pastel aesthetic tube",
          stores: [
            { id: "st-sf1", storeName: "Sephora", price: "$24.00", url: "https://www.sephora.com/product/summer-fridays-lip-butter-balm-P455936" },
          ],
          summary: "Combining rich plant butters with a touch of warm nude tint, Summer Fridays Lip Butter Balm rescues chapped lips while providing high-shine gloss without the sticky mess of traditional glosses.",
        },
        {
          id: "rec-dior",
          name: "Dior Addict Lip Glow Color-Reviving Balm",
          subtitle: "Best Luxury Custom pH Color-Enhancing Lip Balm",
          imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
          imageLabel: "Dior Lip Glow pink luxury couture packaging",
          stores: [
            { id: "st-dr1", storeName: "Sephora", price: "$40.00", url: "https://www.sephora.com/product/dior-addict-lip-glow-color-reviving-lip-balm-P236816" },
          ],
          summary: "Dior Lip Glow is the pinnacle of effortless elegance. Its pH-adapting formula transforms into your skin's ideal rosy tone while wild mango butter plumps and softens lip lines for 24 continuous hours.",
        },
      ],
      customSections: [
        {
          id: "sec-lip-prep",
          title: "How to Prep Lips for All-Day Wear",
          content: "Exfoliate gently with a warm damp washcloth, apply a thin layer of hydrating balm 5 minutes before makeup, and blot excess before applying matte pigments for crisp edges.",
        },
      ],
    },
    isPublished: true,
    isHomeReview: true,
    isRecentBlog: true,
    publishedAt: new Date(Date.now() - 3600 * 1000 * 6),
  });

  // =========================================================================
  // 5. ARTICLE 5: Best Setting Powders
  // =========================================================================
  const art5Slug = "best-setting-powders-blur-filtered-finish";
  const art5P1Slug = "laura-mercier-translucent-loose-setting-powder";
  const art5P2Slug = "huda-beauty-easy-bake-setting-powder";
  const art5P3Slug = "elf-halo-glow-setting-powder";

  await db.delete(posts).where(eq(posts.slug, art5Slug));
  await db.delete(products).where(eq(products.slug, art5P1Slug));
  await db.delete(products).where(eq(products.slug, art5P2Slug));
  await db.delete(products).where(eq(products.slug, art5P3Slug));

  await db.insert(products).values([
    {
      slug: art5P1Slug,
      name: "Laura Mercier Translucent Loose Setting Powder",
      subtitle: "The Undisputed Industry Standard for 16-Hour Matte Finish",
      category: "Beauty & Makeup",
      imageLabel: "Laura Mercier Translucent Setting Powder jar with velour puff",
      imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
      priceCents: 4400,
      compareAtPriceCents: 4800,
      discountPercent: 8,
      rank: 1,
      badge: "HOLY GRAIL",
      rankNote: "Micro-refined french silica blurs pores and locks makeup for 16 hours with zero flashback in flash photography.",
      affiliateUrl: "https://www.sephora.com/product/translucent-loose-setting-powder-P109935",
      stores: [
        { id: "s-lm-1", storeName: "Sephora", price: "$44.00", url: "https://www.sephora.com/product/translucent-loose-setting-powder-P109935" },
        { id: "s-lm-2", storeName: "Nordstrom", price: "$44.00", url: "https://www.nordstrom.com/s/laura-mercier-translucent/2863923" },
        { id: "s-lm-3", storeName: "Amazon", price: "$43.00", url: "https://www.amazon.com/dp/B000OSTE0W" },
      ],
      isFeaturedHome: true,
      isTopPick: true,
      isRecommended: true,
    },
    {
      slug: art5P2Slug,
      name: "Huda Beauty Easy Bake Loose Baking & Setting Powder",
      subtitle: "Best Baking Powder for Airbrushed, Crease-Free Under-Eyes",
      category: "Beauty & Makeup",
      imageLabel: "Huda Beauty Easy Bake powder jar with custom mesh sifter",
      imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
      priceCents: 3800,
      compareAtPriceCents: 4200,
      discountPercent: 10,
      rank: 2,
      badge: "BEST FOR BAKING",
      rankNote: "Ultra-fine vitamin E infused powder absorbs excess sebum, brightens shadowy under-eyes, and leaves a velvet-matte filter.",
      affiliateUrl: "https://www.sephora.com/product/easy-bake-loose-baking-setting-powder-P433402",
      stores: [
        { id: "s-hb-1", storeName: "Sephora", price: "$38.00", url: "https://www.sephora.com/product/easy-bake-loose-baking-setting-powder-P433402" },
        { id: "s-hb-2", storeName: "Amazon", price: "$38.50", url: "https://www.amazon.com/dp/B07DN28Q3Z" },
      ],
      isFeaturedDeals: true,
      isRecommended: true,
    },
    {
      slug: art5P3Slug,
      name: "e.l.f. Halo Glow Setting Powder",
      subtitle: "Best Budget Setting Powder for a Luminous Satin Finish",
      category: "Beauty & Makeup",
      imageLabel: "e.l.f. Halo Glow translucent loose powder jar",
      imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80",
      priceCents: 800,
      compareAtPriceCents: 1000,
      discountPercent: 20,
      rank: 3,
      badge: "BUDGET FAVORITE",
      rankNote: "Weightless lab-crafted sapphire particles impart a soft-focus glow that controls oily zones without looking chalky.",
      affiliateUrl: "https://www.amazon.com/dp/B07Z8G575T",
      stores: [
        { id: "s-elf-1", storeName: "Amazon", price: "$8.00", url: "https://www.amazon.com/dp/B07Z8G575T" },
        { id: "s-elf-2", storeName: "Target", price: "$8.00", url: "https://www.target.com/p/elf-halo-glow" },
        { id: "s-elf-3", storeName: "Ulta Beauty", price: "$8.00", url: "https://www.ulta.com/p/halo-glow-setting-powder-pimprod2012759" },
      ],
      isSaleOff: true,
      isRecommended: true,
    },
  ]);

  await db.insert(posts).values({
    slug: art5Slug,
    title: "The Best Loose and Pressed Setting Powders for a Blur-Filtered Finish",
    excerpt: "Stop mid-day shine and creasing without looking dry. We tested 16 micro-milled finishing powders under 4K cameras and flash lighting.",
    category: "Beauty & Makeup",
    topicLabel: "Face Powders",
    author: "the Lilac Drawer beauty editors",
    imageLabel: "Translucent setting powder with velvet powder puff",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80",
    structuredContent: {
      keywordLinks: [
        { keyword: "Laura Mercier Loose Setting Powder", url: "https://www.sephora.com/product/translucent-loose-setting-powder-P109935" },
        { keyword: "Huda Beauty Easy Bake", url: "https://www.sephora.com/product/easy-bake-loose-baking-setting-powder-P433402" },
        { keyword: "e.l.f. Halo Glow", url: "https://www.amazon.com/dp/B07Z8G575T" },
      ],
      recommendedProducts: [
        {
          id: "rec-lm",
          name: "Laura Mercier Translucent Loose Setting Powder",
          subtitle: "The Undisputed Industry Standard for 16-Hour Matte Finish",
          imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
          imageLabel: "Laura Mercier Translucent Setting Powder jar with velour puff",
          stores: [
            { id: "st-lm1", storeName: "Sephora", price: "$44.00", url: "https://www.sephora.com/product/translucent-loose-setting-powder-P109935" },
            { id: "st-lm2", storeName: "Nordstrom", price: "$44.00", url: "https://www.nordstrom.com/s/laura-mercier-translucent/2863923" },
          ],
          summary: "Laura Mercier's cult classic remains the standard against which all powders are judged. In high-definition flash photography testing, it eliminated greasy forehead and nose shine with zero flashback or ghost-like white cast.",
        },
        {
          id: "rec-hb",
          name: "Huda Beauty Easy Bake Loose Baking & Setting Powder",
          subtitle: "Best Baking Powder for Airbrushed, Crease-Free Under-Eyes",
          imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
          imageLabel: "Huda Beauty Easy Bake powder jar with custom mesh sifter",
          stores: [
            { id: "st-hb1", storeName: "Sephora", price: "$38.00", url: "https://www.sephora.com/product/easy-bake-loose-baking-setting-powder-P433402" },
          ],
          summary: "Huda Beauty's Easy Bake provides the ultimate pore-blurring filter. Specially formulated for the baking technique, it prevents under-eye concealer creasing in hot and humid weather conditions.",
        },
        {
          id: "rec-elf-p",
          name: "e.l.f. Halo Glow Setting Powder",
          subtitle: "Best Budget Setting Powder for a Luminous Satin Finish",
          imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80",
          imageLabel: "e.l.f. Halo Glow translucent loose powder jar",
          stores: [
            { id: "st-el1", storeName: "Amazon", price: "$8.00", url: "https://www.amazon.com/dp/B07Z8G575T" },
          ],
          summary: "At under $10, e.l.f. Halo Glow offers a radiant satin set that softens skin texture rather than creating a flat, chalky matte look.",
        },
      ],
      customSections: [
        {
          id: "sec-powder-guide",
          title: "How to Apply Setting Powder Without Looking Cakey",
          content: "Press powder into a velour powder puff, tap off excess on the back of your hand, and press (never rub) onto the skin for seamless diffusion.",
        },
      ],
    },
    isPublished: true,
    isHomeReview: true,
    isRecentBlog: true,
    publishedAt: new Date(Date.now() - 3600 * 1000 * 8),
  });

  // =========================================================================
  // 6. ARTICLE 6: Best Makeup Brushes & Sponges
  // =========================================================================
  const art6Slug = "best-makeup-brushes-beauty-sponges";
  const art6P1Slug = "real-techniques-everyday-essentials-set";
  const art6P2Slug = "bk-beauty-101-foundation-brush";
  const art6P3Slug = "original-beautyblender-sponge";

  await db.delete(posts).where(eq(posts.slug, art6Slug));
  await db.delete(products).where(eq(products.slug, art6P1Slug));
  await db.delete(products).where(eq(products.slug, art6P2Slug));
  await db.delete(products).where(eq(products.slug, art6P3Slug));

  await db.insert(products).values([
    {
      slug: art6P1Slug,
      name: "Real Techniques Everyday Essentials 5-Piece Makeup Set",
      subtitle: "Best Complete Starter Set for Face & Eye Blending",
      category: "Beauty & Makeup",
      imageLabel: "Real Techniques rose gold synthetic brush set with Miracle Complexion sponge",
      imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80",
      priceCents: 1999,
      compareAtPriceCents: 2499,
      discountPercent: 20,
      rank: 1,
      badge: "BEST VALUE SET",
      rankNote: "UltraPlush synthetic bristles and precision Miracle Complexion sponge deliver salon-grade foundation, blush, and setting results.",
      affiliateUrl: "https://www.amazon.com/dp/B07FTWGL9J",
      stores: [
        { id: "s-rt-1", storeName: "Amazon", price: "$19.99", url: "https://www.amazon.com/dp/B07FTWGL9J" },
        { id: "s-rt-2", storeName: "Target", price: "$19.99", url: "https://www.target.com/p/real-techniques-everyday-essentials" },
        { id: "s-rt-3", storeName: "Ulta Beauty", price: "$20.99", url: "https://www.ulta.com/p/everyday-essentials-brush-set-pimprod2001402" },
      ],
      isFeaturedHome: true,
      isTopPick: true,
      isRecommended: true,
    },
    {
      slug: art6P2Slug,
      name: "BK Beauty 101 Contoured Foundation Blending Brush",
      subtitle: "The Ultimate Streak-Free Foundation Buffer",
      category: "Beauty & Makeup",
      imageLabel: "BK Beauty 101 angled dense synthetic foundation brush",
      imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
      priceCents: 3400,
      compareAtPriceCents: 3800,
      discountPercent: 11,
      rank: 2,
      badge: "PRO PICK",
      rankNote: "Custom angled dome mimics fingertip application, effortlessly buffing liquid and cream foundations into pores without brush streaks.",
      affiliateUrl: "https://www.bkbeauty.com/products/101-contoured-foundation-brush",
      stores: [
        { id: "s-bkb-1", storeName: "BK Beauty", price: "$34.00", url: "https://www.bkbeauty.com/products/101-contoured-foundation-brush" },
        { id: "s-bkb-2", storeName: "Amazon", price: "$34.00", url: "https://www.amazon.com/dp/B085V86Q89" },
      ],
      isFeaturedDeals: true,
      isRecommended: true,
    },
    {
      slug: art6P3Slug,
      name: "Original Beautyblender Flawless Application Sponge",
      subtitle: "The Benchmark for Dewy, Seamless Foundation Diffusion",
      category: "Beauty & Makeup",
      imageLabel: "Original Beautyblender iconic pink teardrop sponge",
      imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
      priceCents: 2000,
      compareAtPriceCents: 2200,
      discountPercent: 9,
      rank: 3,
      badge: "GOLD STANDARD",
      rankNote: "Aqua-activated open-cell foam absorbs water instead of makeup, ensuring minimal product waste and a skin-like finish.",
      affiliateUrl: "https://www.sephora.com/product/the-original-beautyblender-P265810",
      stores: [
        { id: "s-bb-1", storeName: "Sephora", price: "$20.00", url: "https://www.sephora.com/product/the-original-beautyblender-P265810" },
        { id: "s-bb-2", storeName: "Amazon", price: "$20.00", url: "https://www.amazon.com/dp/B000I1O40E" },
      ],
      isRecommended: true,
    },
  ]);

  await db.insert(posts).values({
    slug: art6Slug,
    title: "The Best Makeup Brushes and Beauty Sponges for Flawless Base Application",
    excerpt: "The right tools make even budget cosmetics look like airbrushed perfection. Here are the top-rated brush sets and blending sponges tested in our lab.",
    category: "Beauty & Makeup",
    topicLabel: "Tools & Brushes",
    author: "the Lilac Drawer beauty editors",
    imageLabel: "Set of professional soft synthetic makeup brushes",
    imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200&auto=format&fit=crop&q=80",
    structuredContent: {
      keywordLinks: [
        { keyword: "Real Techniques Everyday Essentials", url: "https://www.amazon.com/dp/B07FTWGL9J" },
        { keyword: "BK Beauty 101 Brush", url: "https://www.bkbeauty.com/products/101-contoured-foundation-brush" },
        { keyword: "Beautyblender", url: "https://www.sephora.com/product/the-original-beautyblender-P265810" },
      ],
      recommendedProducts: [
        {
          id: "rec-rt",
          name: "Real Techniques Everyday Essentials 5-Piece Makeup Set",
          subtitle: "Best Complete Starter Set for Face & Eye Blending",
          imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80",
          imageLabel: "Real Techniques rose gold synthetic brush set with Miracle Complexion sponge",
          stores: [
            { id: "st-rt1", storeName: "Amazon", price: "$19.99", url: "https://www.amazon.com/dp/B07FTWGL9J" },
            { id: "st-rt2", storeName: "Target", price: "$19.99", url: "https://www.target.com/p/real-techniques-everyday-essentials" },
          ],
          summary: "The Real Techniques Everyday Essentials bundle delivers all core brushes needed for daily makeup. The synthetic bristles shed zero hairs during washing and blend powders, creams, and liquids with equal finesse.",
        },
        {
          id: "rec-bk",
          name: "BK Beauty 101 Contoured Foundation Blending Brush",
          subtitle: "The Ultimate Streak-Free Foundation Buffer",
          imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
          imageLabel: "BK Beauty 101 angled dense synthetic foundation brush",
          stores: [
            { id: "st-bk1", storeName: "BK Beauty", price: "$34.00", url: "https://www.bkbeauty.com/products/101-contoured-foundation-brush" },
          ],
          summary: "BK Beauty 101 has transformed foundation application for hundreds of thousands of users. The dense angled head allows you to get right into the corners of the nose and eyes while buffing base makeup to an airbrushed finish in under 60 seconds.",
        },
        {
          id: "rec-bb",
          name: "Original Beautyblender Flawless Application Sponge",
          subtitle: "The Benchmark for Dewy, Seamless Foundation Diffusion",
          imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
          imageLabel: "Original Beautyblender iconic pink teardrop sponge",
          stores: [
            { id: "st-bb1", storeName: "Sephora", price: "$20.00", url: "https://www.sephora.com/product/the-original-beautyblender-P265810" },
          ],
          summary: "When dampened with water, the Beautyblender expands to double its size, bouncing gently over skin to melt creams and foundations together without absorbing excessive cosmetic product.",
        },
      ],
      customSections: [
        {
          id: "sec-brush-wash",
          title: "How to Wash and Maintain Your Brushes",
          content: "Wash brushes once weekly using a gentle brush shampoo or solid soap bar. Squeeze water out, reshape the bristles, and lay flat on a clean towel with the brush heads hanging over the counter edge to dry.",
        },
      ],
    },
    isPublished: true,
    isHomeReview: true,
    isRecentBlog: true,
    publishedAt: new Date(Date.now() - 3600 * 1000 * 10),
  });

  console.log("All 6 Wirecutter-style Makeup articles and 18 products seeded successfully!");
  process.exit(0);
}

seedMakeupArticle().catch((e) => {
  console.error(e);
  process.exit(1);
});
