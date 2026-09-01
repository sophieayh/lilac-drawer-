/**
 * One-off script: promotes a user to admin by email, without needing
 * Drizzle Studio. Usage:
 *
 *   npx tsx db/make-admin.ts someone@example.com
 *
 * Safe to run more than once — it's just an UPDATE on that one row.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { user } from "./schema";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx db/make-admin.ts someone@example.com");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — add it to .env.local");

const db = drizzle(new Pool({ connectionString }));

async function main() {
  const result = await db.update(user).set({ role: "admin" }).where(eq(user.email, email)).returning({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  if (result.length === 0) {
    console.error(`No user found with email "${email}". Did you sign up at /signup first?`);
    process.exit(1);
  }

  console.log("Done — this account is now admin:", result[0]);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
