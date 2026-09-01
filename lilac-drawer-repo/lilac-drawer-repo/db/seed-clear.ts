import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";
import { products, posts, siteCategories, communityPosts, trends, user, comments, likes } from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — add it to .env.local");

const db = drizzle(new Pool({ connectionString }), { schema });

/**
 * Undoes `npm run db:seed` — deletes every row seed.ts inserts (demo
 * products, posts, community content, and the four demo accounts it
 * creates), leaving the schema intact but empty. Same "clear before
 * insert" approach seed.ts itself already uses for re-seeding, exposed as
 * its own command for going from "demo content" to "clean, ready for real
 * content via the admin dashboard" without a full database reset.
 *
 * This is a dev-time convenience, not a production-safe operation: it
 * deletes every row in these tables, including any real products/articles/
 * community posts already added by then — same caveat db:seed's own
 * re-seed behavior has. Safe to run right after `db:migrate`, before any
 * real content exists; don't run it once the site has real content.
 */
async function main() {
  console.log("Clearing demo content…");

  await db.delete(likes);
  await db.delete(comments);
  await db.delete(communityPosts);
  await db.delete(posts);
  await db.delete(products);
  await db.delete(siteCategories);
  await db.delete(trends);

  for (const handle of ["lilacdrawer", "minastyle", "elenawears", "closetedit"]) {
    await db.delete(user).where(eq(user.handle, handle));
  }

  console.log("Demo content cleared. Database is empty and ready for real content.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
