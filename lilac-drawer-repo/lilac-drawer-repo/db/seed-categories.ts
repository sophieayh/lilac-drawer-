import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";
import { siteCategories } from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — add it to .env.local");

const db = drizzle(new Pool({ connectionString }), { schema });

async function main() {
  console.log("Seeding clean categories without emojis...");

  // Remove existing header categories if any, or keep existing and insert fresh
  await db.delete(siteCategories).where(eq(siteCategories.section, "header"));

  await db.insert(siteCategories).values([
    {
      label: "Beauty & Makeup",
      slug: "beauty-makeup",
      icon: null,
      colorHex: "#f3c6d6",
      href: "/blog",
      section: "header",
      sortOrder: 1,
      isActive: true,
      subcategories: [
        {
          id: "sub-1-1",
          label: "Makeup Essentials",
          href: "/blog/best-everyday-makeup-essentials",
          description: "Foundations, blushes & setting sprays tested for all-day wear",
        },
        {
          id: "sub-1-2",
          label: "Skincare & Serums",
          href: "/deals",
          description: "Hydrating hyaluronic serums, SPF & nourishing creams",
        },
        {
          id: "sub-1-3",
          label: "Haircare & Styling",
          href: "/deals",
          description: "Ionic dryers, silk heatless curlers & repair oils",
        },
        {
          id: "sub-1-4",
          label: "Fragrance & Body",
          href: "/deals",
          description: "Clean luxury scents & ultra-moisturizing body butters",
        },
      ],
    },
    {
      label: "Clothing Care",
      slug: "clothing-care",
      icon: null,
      colorHex: "#e8f0e4",
      href: "/deals",
      section: "header",
      sortOrder: 2,
      isActive: true,
      subcategories: [
        {
          id: "sub-2-1",
          label: "Garment Steamers",
          href: "/deals",
          description: "Handheld & standing steamers tested for rapid de-wrinkling",
        },
        {
          id: "sub-2-2",
          label: "Fabric Shavers",
          href: "/deals",
          description: "Rechargeable lint & pill removers for wool and cashmere",
        },
        {
          id: "sub-2-3",
          label: "Wool Dryer Balls",
          href: "/deals",
          description: "Natural New Zealand wool balls to reduce drying time & wrinkles",
        },
        {
          id: "sub-2-4",
          label: "Lint Rollers & Brushes",
          href: "/deals",
          description: "Reusable sticky rollers & natural bristle clothes brushes",
        },
      ],
    },
    {
      label: "Wardrobe Storage",
      slug: "wardrobe-storage",
      icon: null,
      colorHex: "#f6eff8",
      href: "/deals",
      section: "header",
      sortOrder: 3,
      isActive: true,
      subcategories: [
        {
          id: "sub-3-1",
          label: "Closet Organizers",
          href: "/deals",
          description: "Honeycomb drawer dividers, shelf risers & modular bins",
        },
        {
          id: "sub-3-2",
          label: "Cedar Blocks & Rings",
          href: "/deals",
          description: "100% natural red cedar moth defense and closet freshener",
        },
        {
          id: "sub-3-3",
          label: "Velvet & Wooden Hangers",
          href: "/deals",
          description: "Slim space-saving velvet hangers & contoured wooden coat hangers",
        },
        {
          id: "sub-3-4",
          label: "Under-Bed Storage",
          href: "/deals",
          description: "Heavy-duty breathable fabric bins with clear view windows",
        },
      ],
    },
    {
      label: "Jewelry & Watches",
      slug: "jewelry-watches",
      icon: null,
      colorHex: "#f3e6d0",
      href: "/deals",
      section: "header",
      sortOrder: 4,
      isActive: true,
      subcategories: [
        {
          id: "sub-4-1",
          label: "Anti-Tarnish Boxes",
          href: "/deals",
          description: "Velvet-lined lockable jewelry boxes that prevent silver oxidation",
        },
        {
          id: "sub-4-2",
          label: "Travel Organizers",
          href: "/deals",
          description: "Foldable leather jewelry rolls for necklaces, rings & studs",
        },
        {
          id: "sub-4-3",
          label: "Ultrasonic Cleaners",
          href: "/deals",
          description: "Gentle 42,000Hz wave jewelry polishers for rings and diamonds",
        },
        {
          id: "sub-4-4",
          label: "Watch Cases & Winders",
          href: "/deals",
          description: "Automatic watch winders with quiet Japanese motors",
        },
      ],
    },
    {
      label: "Bags & Accessories",
      slug: "bags-accessories",
      icon: null,
      colorHex: "#efe3f2",
      href: "/deals",
      section: "header",
      sortOrder: 5,
      isActive: true,
      subcategories: [
        {
          id: "sub-5-1",
          label: "Tote Bags & Purses",
          href: "/deals",
          description: "Structured leather totes, nylon work bags & crossbody bags",
        },
        {
          id: "sub-5-2",
          label: "Silk Scarves & Bandanas",
          href: "/deals",
          description: "100% mulberry silk twill square scarves with hand-rolled edges",
        },
        {
          id: "sub-5-3",
          label: "Felt Bag Shapers",
          href: "/deals",
          description: "Custom inserts that keep designer handbags structured and neat",
        },
        {
          id: "sub-5-4",
          label: "Cardholders & Wallets",
          href: "/deals",
          description: "Slim RFID-blocking grained leather wallets and zip pouches",
        },
      ],
    },
  ]);

  console.log("Clean categories seeded successfully without emojis!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
