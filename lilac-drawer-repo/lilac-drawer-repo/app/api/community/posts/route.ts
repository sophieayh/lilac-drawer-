import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { communityPosts, user } from "@/db/schema";
import { assertNoExternalLinks } from "@/lib/link-moderation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "You must be signed in to post." }, { status: 401 });
    }

    const bodyData = await request.json();
    const { body = "", productId, articleId, imageLabel, images, imageUrl, collageData } = bodyData;
    const trimmed = typeof body === "string" ? body.trim() : "";

    let effectiveImages: string[] | null = null;
    if (Array.isArray(images) && images.length > 0) {
      effectiveImages = images.slice(0, 3);
    } else if (typeof imageUrl === "string" && imageUrl) {
      effectiveImages = [imageUrl];
    }
    const effectiveImageUrl = effectiveImages ? effectiveImages[0] : null;
    const hasImage = !!effectiveImageUrl;

    if (!trimmed && !hasImage && !articleId && !productId && !collageData) {
      return NextResponse.json({ error: "Post cannot be empty." }, { status: 400 });
    }

    if (trimmed.length > 2000) {
      return NextResponse.json({ error: "Post is too long (max 2000 characters)." }, { status: 400 });
    }

    if (trimmed) {
      assertNoExternalLinks(trimmed, "posts");
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
        imageLabel: imageLabel ?? (collageData ? "Fashion Moodboard" : (hasImage ? "Attached photo" : null)),
        collageData: collageData ?? null,
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
