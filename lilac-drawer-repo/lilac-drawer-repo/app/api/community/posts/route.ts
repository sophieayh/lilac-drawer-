import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { communityPosts, user } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "You must be signed in to post." }, { status: 401 });
    }

    const bodyData = await request.json();
    const { body = "", productId, articleId, imageLabel, images } = bodyData;
    const trimmed = typeof body === "string" ? body.trim() : "";

    const effectiveImages: string[] | null =
      Array.isArray(images) && images.length > 0 ? images.slice(0, 3) : null;
    const effectiveImageUrl = effectiveImages ? effectiveImages[0] : null;
    const hasImage = !!effectiveImageUrl;

    if (!trimmed && !hasImage && !articleId) {
      return NextResponse.json({ error: "Post cannot be empty." }, { status: 400 });
    }

    if (trimmed.length > 2000) {
      return NextResponse.json({ error: "Post is too long (max 2000 characters)." }, { status: 400 });
    }

    const [row] = await db
      .insert(communityPosts)
      .values({
        userId: session.user.id,
        body: trimmed,
        productId: typeof productId === "number" ? productId : null,
        articleId: typeof articleId === "number" ? articleId : null,
        hasImage,
        imageUrl: effectiveImageUrl,
        images: effectiveImages,
        imageLabel: imageLabel ?? (hasImage ? "Attached photo" : null),
      })
      .returning();

    revalidatePath("/community");
    const [author] = await db
      .select({ handle: user.handle })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);
    if (author?.handle) {
      revalidatePath(`/community/${author.handle}`);
    }

    return NextResponse.json({ id: row.id });
  } catch (err) {
    console.error("Failed to create post via API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create post" },
      { status: 500 }
    );
  }
}
