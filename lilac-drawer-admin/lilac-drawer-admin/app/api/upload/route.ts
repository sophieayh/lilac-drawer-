import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/admin";

// Images this app will accept from the Articles/Products forms. Kept in
// sync with the `accept` attribute on <ImageUploadField>.
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_BYTES = 4.5 * 1024 * 1024; // Vercel's server-upload request body limit.

/**
 * Admin-only image upload endpoint, used by ArticleForm and ProductForm.
 * Stores the file in Vercel Blob (public access, random suffix so two
 * editors uploading "cover.jpg" never collide) and returns its public URL,
 * which the form then saves into `posts.imageUrl` / `products.imageUrl` —
 * the exact same column the public site already reads from, so nothing
 * about the read path changes.
 */
export async function POST(request: Request) {
  // Re-derives the acting user from the session server-side — never trusts
  // anything the client claims about who it is.
  await requireAdmin();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Request must be multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type. Use JPEG, PNG, WebP, AVIF, or GIF." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 4.5MB)." }, { status: 400 });
  }

  const rawKind = formData.get("kind");
  const kind =
    rawKind === "products"
      ? "products"
      : rawKind === "banners"
        ? "banners"
        : rawKind === "yearly_wrap"
          ? "yearly_wrap"
          : "articles";

  if (process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN !== "vercel_blob_rw_...") {
    try {
      const blob = await put(`${kind}/${file.name}`, file, {
        access: "public",
        addRandomSuffix: true,
      });
      return NextResponse.json({ url: blob.url });
    } catch (err) {
      console.warn("Vercel Blob upload failed, using local Data URL fallback:", err);
    }
  }

  // Local development fallback: convert to base64 Data URL so local dev works without Vercel Blob store
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    return NextResponse.json({ url: dataUrl });
  } catch (err) {
    console.error("Local upload fallback failed:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
