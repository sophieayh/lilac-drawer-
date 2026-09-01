import "server-only";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (local Postgres) or your " +
      "Vercel project's Environment Variables (a Neon/Postgres connection string).",
  );
}

// Neon's serverless HTTP driver is required on Vercel: serverless functions
// are short-lived and can't maintain a pooled TCP connection the way a
// long-running Node server can. For local development against a normal
// Postgres instance (e.g. `localhost`), fall back to the standard
// node-postgres driver instead — Neon's driver only speaks to Neon's HTTP
// endpoint.
const isNeon = connectionString.includes("neon.tech");

export const db = isNeon
  ? drizzleNeon(neon(connectionString), { schema })
  : drizzleNodePg(new Pool({ connectionString }), { schema });
