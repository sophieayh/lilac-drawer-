"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/community-actions";

export default function PostComposer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [body, setBody] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP, etc.).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size is too large (max 5MB).");
      return;
    }

    setError(null);
    setImageName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      // Optimize image size using an in-memory canvas
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setImagePreview(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          setImagePreview(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImagePreview(null);
    setImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if ((!body.trim() && !imagePreview) || isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        await createPost(body, undefined, imagePreview, imageName);
        setBody("");
        handleRemoveImage();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form id="composer" onSubmit={handleSubmit} className="flex gap-3.5 px-6 py-5 border-b border-border">
      <div className="w-11 h-11 shrink-0 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-heading font-bold" aria-hidden="true">
        ✦
      </div>
      <div className="flex-1 min-w-0">
        <label htmlFor="composer-input" className="sr-only">
          What&apos;s inspiring you today?
        </label>
        <textarea
          id="composer-input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's inspiring you today?"
          maxLength={2000}
          rows={2}
          className="w-full border-none bg-transparent outline-none text-[17px] py-1.5 resize-none text-ink placeholder:text-tan"
        />

        {/* Image Preview Box */}
        {imagePreview && (
          <div className="relative mt-2 mb-3 inline-block max-w-full">
            <div className="relative rounded-2xl overflow-hidden border border-border bg-mauve-50 max-h-[300px] max-w-[420px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Selected upload preview"
                className="w-full h-auto max-h-[300px] object-cover"
              />
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              title="Remove image"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/75 hover:bg-ink text-white flex items-center justify-center text-xs font-bold shadow-md transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {error && <p className="text-xs text-rose mb-2">{error}</p>}

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          {/* Attach Image Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleFileChange}
              className="hidden"
              id="composer-image-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-purple-deep hover:text-rose text-sm font-medium py-1.5 px-3 rounded-full hover:bg-mauve-50 transition-colors"
              title="Attach Photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <span>Photo</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || (!body.trim() && !imagePreview)}
            className="bg-lilac hover:bg-purple-deep text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(201,163,198,0.35)]"
          >
            {isPending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
