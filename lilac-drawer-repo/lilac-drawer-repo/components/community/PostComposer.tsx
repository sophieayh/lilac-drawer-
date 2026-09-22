"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/image-utils";
import { formatPrice } from "@/lib/format";
import { checkExternalLinks } from "@/lib/link-moderation";
import ImageSlot from "@/components/ImageSlot";

interface SelectedImage {
  dataUrl: string;
  name: string;
}

interface AttachedProduct {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  imageUrl?: string | null;
  imageLabel?: string | null;
  category?: string;
}

export default function PostComposer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [body, setBody] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [attachedProduct, setAttachedProduct] = useState<AttachedProduct | null>(null);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<AttachedProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Search products when query changes
  useEffect(() => {
    if (!isProductPickerOpen) return;
    const trimmed = productQuery.trim();
    if (!trimmed) {
      // Default to empty or popular
      fetch("/api/search/suggest?q=a")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.products)) {
            setProductResults(data.products.slice(0, 6));
          }
        })
        .catch(() => {});
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (Array.isArray(data.products)) {
          setProductResults(data.products);
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [productQuery, isProductPickerOpen]);

  useEffect(() => {
    if (isProductPickerOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isProductPickerOpen]);

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
    if (!body.trim() && selectedImages.length === 0 && !attachedProduct) return;

    const linkCheck = checkExternalLinks(body);
    if (linkCheck.hasExternalLink) {
      setError(linkCheck.errorMessage || "External links are not allowed in community posts.");
      return;
    }

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
            productId: attachedProduct?.id ?? null,
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
        setAttachedProduct(null);
        setIsProductPickerOpen(false);
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
    <form onSubmit={handleSubmit} className="flex gap-3 px-3.5 sm:px-6 py-4 sm:py-4.5 border-b border-border bg-white relative">
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
          placeholder={attachedProduct ? "What are your thoughts on this product?" : "What's inspiring you today?"}
          maxLength={2000}
          rows={2}
          className="w-full border-none bg-transparent outline-none text-[17px] py-1.5 resize-none text-ink placeholder:text-tan"
        />

        {/* Attached Product Preview */}
        {attachedProduct && (
          <div className="relative mt-2 mb-3 rounded-2xl border border-border bg-mauve-50/70 p-3 flex items-center gap-3">
            {attachedProduct.imageUrl ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachedProduct.imageUrl}
                  alt={attachedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : attachedProduct.imageLabel ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border bg-white">
                <ImageSlot
                  label={attachedProduct.imageLabel}
                  className="w-full h-full"
                  shape="rounded"
                  radius={8}
                  tone="mauve"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-lilac/20 flex items-center justify-center text-lg shrink-0">
                🛍️
              </div>
            )}

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-rose uppercase tracking-wider block">
                {attachedProduct.category || "Product Deal"}
              </span>
              <h5 className="font-heading text-xs sm:text-sm font-bold text-purple-deep truncate">
                {attachedProduct.name}
              </h5>
              {attachedProduct.priceCents != null && (
                <span className="text-xs font-bold text-rose">
                  {formatPrice(attachedProduct.priceCents)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAttachedProduct(null)}
              title="Remove attached product"
              className="w-7 h-7 rounded-full bg-white hover:bg-mauve-100 text-tan-dark hover:text-purple-deep flex items-center justify-center shadow-xs border border-border transition-colors cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        )}

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
          <div className="flex items-center gap-4">
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

            {/* Attach Product Button */}
            <button
              type="button"
              onClick={() => setIsProductPickerOpen((prev) => !prev)}
              className={`group inline-flex items-center gap-1.5 text-sm font-semibold py-1 transition-colors duration-200 cursor-pointer select-none ${
                attachedProduct ? "text-rose" : "text-purple-deep hover:text-rose"
              }`}
              title="Attach Product to Post"
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
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="transition-colors duration-200">
                {attachedProduct ? "Product Attached" : "Tag Product"}
              </span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || (!body.trim() && selectedImages.length === 0 && !attachedProduct)}
            className="bg-lilac hover:bg-purple-deep text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(201,163,198,0.35)] cursor-pointer"
          >
            {isPending ? "Posting…" : "Post"}
          </button>
        </div>

        {/* Product Picker Dropdown/Popover */}
        {isProductPickerOpen && (
          <div className="mt-3 p-3 bg-mauve-50/90 border border-border rounded-2xl shadow-lg animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-deep uppercase tracking-wider">
                Select a Product to Share
              </span>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="text-xs text-tan hover:text-purple-deep cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="relative mb-2">
              <input
                ref={searchInputRef}
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search products by title or category…"
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-lilac text-purple-deep"
              />
              {isSearching && (
                <span className="absolute right-3 top-2.5 text-[11px] text-tan">Searching…</span>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-border/50">
              {productResults.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    setAttachedProduct(prod);
                    setIsProductPickerOpen(false);
                    setProductQuery("");
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-white flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  {prod.imageUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-lilac/20 flex items-center justify-center text-sm shrink-0">
                      🛍️
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-purple-deep group-hover:text-rose transition-colors truncate">
                      {prod.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-tan-dark">
                      <span>{prod.category}</span>
                      {prod.priceCents != null && (
                        <span className="font-bold text-rose">{formatPrice(prod.priceCents)}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    Select +
                  </span>
                </button>
              ))}

              {productResults.length === 0 && !isSearching && (
                <div className="py-4 text-center text-xs text-tan">
                  No products found. Try a different search term.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
