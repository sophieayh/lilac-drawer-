import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pageViews } from "@/db/schema";
import { siteConfig } from "@/lib/site";

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  // No Origin/Referer at all (e.g. some sendBeacon calls) — can't confirm
  // either way, so don't block; the check below only rejects a *mismatched*
  // origin, which is the actual spam signal.
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(siteConfig.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // This endpoint is necessarily unauthenticated (every visitor hits it) —
  // this same-origin check is a lightweight deterrent against low-effort
  // external spam, not a substitute for real rate limiting. It's fine for
  // page-view counts to be approximate; nothing security-sensitive reads
  // this table.
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  let path = "/";
  try {
    const body = await request.json();
    if (typeof body?.path === "string" && body.path.startsWith("/")) {
      path = body.path.slice(0, 300);
    }
  } catch {
    // ignore malformed bodies — still record a generic hit below
  }

  try {
    await db.insert(pageViews).values({ path });
  } catch {
    // Analytics is best-effort — a logging failure should never surface to
    // the visitor or break the page they're on.
  }

  return NextResponse.json({ ok: true, tracked: true });
}
