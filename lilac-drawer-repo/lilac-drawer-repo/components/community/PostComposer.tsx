"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/image-utils";

interface SelectedImage {
  dataUrl: string;
  name: string;
}

export default function PostComposer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [body, setBody] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 3 - selectedImages.length;
    if (remainingSlots <= 0) {
      setError("Maximum 3 photos allowed per post.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} photo(s) added (maximum 3 allowed).`);
    } else {
      setError(null);
    }

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (PNG, JPG, WebP, etc.).");
        continue;
      }

      if (file.size > 15 * 1024 * 1024) {
        setError(`"${file.name}" is too large (max 15MB).`);
        continue;
      }

      // Automatically compress image before preview and upload to keep performance fast
      compressImage(file, 1400, 0.82)
        .then((compressedUrl) => {
          setSelectedImages((prev) => {
            if (prev.length >= 3) return prev;
            return [...prev, { dataUrl: compressedUrl, name: file.name }];
          });
        })
        .catch(() => {
          setError(`Failed to process "${file.name}".`);
        });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveImage(index: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 bg-mauve-50/50 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep text-sm font-bold shrink-0">
            <svg className="w-5 h-5 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-deep">Join the Conversation</p>
            <p className="text-xs text-tan-dark">Sign in to share your thoughts, photos, and recommendations.</p>
          </div>
        </div>
        <a
          href="/login?redirect=/community"
          className="w-full sm:w-auto text-center shrink-0 bg-purple-deep text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-lilac transition-all"
        >
          Sign In
        </a>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && selectedImages.length === 0) return;

    setError(null);

    startTransition(async () => {
      try {
        let uploadedUrls: string[] = [];

        if (selectedImages.length > 0) {
          uploadedUrls = await Promise.all(
            selectedImages.map(async (img) => {
              const res = await fetch("/api/community/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  dataUrl: img.dataUrl,
                  filename: img.name || "upload.jpg",
                }),
              });
              const data = await res.json();
              if (!res.ok || !data.url) {
                throw new Error(data.error || "Failed to upload image");
              }
              return data.url as string;
            })
          );
        }

        const postRes = await fetch("/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: body.trim(),
            images: uploadedUrls.length > 0 ? uploadedUrls : null,
            imageLabel: selectedImages[0]?.name || (uploadedUrls.length > 0 ? "Attached photo" : null),
          }),
        });

        const postData = await postRes.json();
        if (!postRes.ok) {
          throw new Error(postData.error || "Failed to publish post. Please try again.");
        }

        setBody("");
        setSelectedImages([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to publish post. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 px-3.5 sm:px-6 py-4 sm:py-4.5 border-b border-border bg-white">
      <div className="w-11 h-11 shrink-0 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-heading font-bold" aria-hidden="true">
        <svg className="w-5 h-5 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
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

        {/* Image Previews (Max 3) */}
        {selectedImages.length > 0 && (
          <div className="mt-2.5 mb-3">
            <div
              className={`grid gap-2 ${
                selectedImages.length === 1
                  ? "grid-cols-1 max-w-[420px]"
                  : selectedImages.length === 2
                  ? "grid-cols-2 max-w-[480px]"
                  : "grid-cols-3 max-w-[540px]"
              }`}
            >
              {selectedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl overflow-hidden border border-border bg-mauve-50 aspect-4/3 max-h-[260px] group/thumb"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt={`Selected upload preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    title="Remove image"
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-ink/75 hover:bg-ink text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-rose mb-2">{error}</p>}

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          {/* Attach Image Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleFileChange}
              className="hidden"
              id="composer-image-upload"
              disabled={selectedImages.length >= 3}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedImages.length >= 3}
              className="group inline-flex items-center gap-1.5 text-purple-deep hover:text-rose text-sm font-semibold py-1 transition-colors duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
              title={selectedImages.length >= 3 ? "Maximum 3 photos reached" : "Attach Photos (up to 3)"}
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
                className="transition-transform duration-200 group-hover:scale-125"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <span className="transition-colors duration-200">
                Photo {selectedImages.length > 0 ? `(${selectedImages.length}/3)` : ""}
              </span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || (!body.trim() && selectedImages.length === 0)}
            className="bg-lilac hover:bg-purple-deep text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(201,163,198,0.35)]"
          >
            {isPending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
