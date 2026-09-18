import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to upload images.' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') || '';

  // 1. Handling JSON base64 dataUrl upload
  if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      const { dataUrl } = body;

      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json({ error: 'Invalid image data.' }, { status: 400 });
      }

      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'Invalid image format.' }, { status: 400 });
      }

      const mimeType = match[1].toLowerCase();
      if (!ALLOWED_TYPES.has(mimeType)) {
        return NextResponse.json(
          { error: 'Unsupported image type. Please upload a JPEG, PNG, WebP, GIF, or AVIF image.' },
          { status: 400 }
        );
      }

      const base64Data = match[2];
      const approxBytes = (base64Data.length * 3) / 4;
      if (approxBytes > MAX_BYTES) {
        return NextResponse.json({ error: 'Image file is too large (max 5MB).' }, { status: 400 });
      }

      return NextResponse.json({ url: dataUrl });
    } catch (err) {
      console.error('JSON upload error:', err);
      return NextResponse.json({ error: 'Failed to process image.' }, { status: 500 });
    }
  }

  // 2. Handling Multipart FormData upload
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: 'Unsupported image type. Please upload a JPEG, PNG, WebP, GIF, or AVIF image.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: 'Image file is too large (max 5MB).' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

      return NextResponse.json({ url: dataUrl });
    } catch (err) {
      console.error('FormData upload error:', err);
      return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' }, { status: 400 });
}
