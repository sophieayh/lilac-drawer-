import { NextRequest, NextResponse } from "next/server";
import { savePushSubscription, removePushSubscription } from "@/lib/push-notifications";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "VAPID public key not configured" }, { status: 500 });
  }
  return NextResponse.json({ publicKey });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }

    await savePushSubscription({
      endpoint,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to register push subscription:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to register subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    await removePushSubscription(endpoint);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete push subscription:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
