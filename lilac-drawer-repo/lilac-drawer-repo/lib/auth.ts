import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { db } from "@/db";
import * as schema from "@/db/schema";

// These collide with real routes under /community/[handle] (e.g. "post" is
// also /community/post/[id]) — a user with one of these usernames would
// find their own profile 404ing, since Next.js matches the static route
// segment before the dynamic [handle] one. Enforced here too (not just in
// the signup form) since the form's check alone can be bypassed by calling
// the API directly.
const RESERVED_HANDLES = new Set(["post", "api"]);

export const auth = betterAuth({
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
      // `input: false` — never settable via signup/update-user client calls;
      // only ever changed server-side (admin dashboard's Users page).
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          const handle = (userData as { handle?: string }).handle;
          if (handle && RESERVED_HANDLES.has(handle.toLowerCase())) {
            throw new APIError("BAD_REQUEST", { message: "That username isn't available." });
          }
          return { data: userData };
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
  },
  // Better Auth rate-limits auth endpoints by default, but only when
  // NODE_ENV is exactly "production" — explicit here so brute-force
  // protection on /sign-in/email etc. also applies to staging/preview
  // deployments, not just the final prod environment.
  rateLimit: {
    enabled: true,
  },
});
