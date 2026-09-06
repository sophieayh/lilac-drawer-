import fs from "fs";
import path from "path";
import { Pool } from "pg";

// parse .env.local
const envPath = path.join(process.cwd(), ".env.local");
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      dbUrl = trimmed.substring("DATABASE_URL=".length).replace(/^["']|["']$/g, "");
      break;
    }
  }
}

async function main() {
  if (!dbUrl) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });

  console.log("Creating banners table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      image_url TEXT NOT NULL,
      image_label TEXT NOT NULL DEFAULT 'Advertisement',
      link_url TEXT NOT NULL,
      placement VARCHAR(60) NOT NULL DEFAULT 'community_banner',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      badge_text VARCHAR(40) DEFAULT 'Sponsored',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  const { rows } = await pool.query(`SELECT COUNT(*) FROM banners`);
  if (parseInt(rows[0].count, 10) === 0) {
    console.log("Seeding sample community banners...");
    await pool.query(`
      INSERT INTO banners (title, subtitle, image_url, image_label, link_url, placement, sort_order, is_active, badge_text)
      VALUES 
      (
        'Rare Beauty Soft Pinch Liquid Blush Collection',
        'Discover weightless, long-lasting dewy pigment for an effortless flush — 20% off today.',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
        'Rare Beauty Blush Collection',
        '/blog/best-everyday-makeup-essentials',
        'community_banner',
        1,
        true,
        'Sponsored'
      ),
      (
        'Summer Glow Makeup & Skincare Guide',
        'The definitive editor-tested essentials for a natural glass-skin finish all season long.',
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80',
        'Summer Glow Essentials',
        '/blog/best-under-eye-concealers-dark-circles',
        'community_banner',
        2,
        true,
        'Special Feature'
      ),
      (
        'Fenty Beauty Gloss Bomb Universal Lip Luminizer',
        'The ultimate gotta-have-it lip gloss with explosive shine that feels as good as it looks.',
        'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=80',
        'Fenty Beauty Gloss Bomb',
        '/deals/garment-steamer-pro',
        'community_banner',
        3,
        true,
        'Exclusive Deal'
      );
    `);
    console.log("Sample banners seeded successfully!");
  } else {
    console.log(`Found ${rows[0].count} banners already in database.`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
