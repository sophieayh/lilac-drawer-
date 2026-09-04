import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

// Points at the exact same `user`/`session`/`account`/`verification` tables
// as the public Lilac Drawer site — an account created via /signup on the
// main site can sign in here too, as soon as its `role` is set to "admin".
export const auth = betterAuth({
  trustedOrigins: [
    "http://localhost:3001",
    "https://*.trycloudflare.com",
    "https://*.localtunnel.me",
    "https://*.ngrok-free.app",
    "https://*.pinggy.link",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      handle: {
        type: "string",
        required: true,
        unique: true,
        input: true,
      },
      bio: {
        type: "string",
        required: false,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
  },
});
