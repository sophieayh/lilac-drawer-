"use client";

import { useRef, useState } from "react";

/**
 * Drop-in replacement for a plain "Photo URL" text input. Renders a hidden
 * text input (named `name`, so the surrounding <form action={...}> still
 * submits `imageUrl` exactly like before) plus a file picker that uploads
 * to /api/upload and fills that hidden input with the resulting Vercel Blob
 * URL. A manual URL paste still works too, for a photo already hosted
 * elsewhere — upload isn't the only path in.
 */
export default function ImageUploadField({
  name,
  defaultValue,
  value: controlledValue,
  onChange: controlledOnChange,
  kind,
}: {
  name?: string;
  defaultValue?: string | null;
  value?: string;
  onChange?: (val: string) => void;
  kind: "articles" | "products" | "banners" | "yearly_wrap";
}) {
  const [internalUrl, setInternalUrl] = useState(defaultValue ?? "");
  const [internalPreview, setInternalPreview] = useState(defaultValue ?? "");

  const url = controlledValue !== undefined ? controlledValue : internalUrl;
  const preview = controlledValue !== undefined ? controlledValue : internalPreview;

  const setUrlAndPreview = (newUrl: string) => {
    if (controlledOnChange) {
      controlledOnChange(newUrl);
    } else {
      setInternalUrl(newUrl);
      setInternalPreview(newUrl);
    }
  };

  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const field = "w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lilac";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError("");

    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);

    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setUrlAndPreview(data.url);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {name && <input type="hidden" name={name} value={url} />}

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- lightweight admin-only preview, not the public site
        <img src={preview} alt="" className="h-24 w-24 rounded-lg object-cover border border-border" />
      )}

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-purple-deep border border-border rounded-lg px-3 py-2 cursor-pointer hover:border-lilac">
          {status === "uploading" ? "Uploading…" : preview ? "Replace photo" : "Upload photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            onChange={handleFileChange}
            disabled={status === "uploading"}
            className="hidden"
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={() => {
              setUrlAndPreview("");
            }}
            className="text-xs text-tan-dark hover:text-purple-deep"
          >
            Remove
          </button>
        )}
      </div>

      {status === "error" && <p className="text-xs text-red-600">{error}</p>}

      <details className="text-xs text-tan-dark">
        <summary className="cursor-pointer select-none">Or paste a photo URL directly</summary>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrlAndPreview(e.target.value);
          }}
          placeholder="https://…"
          className={`${field} mt-2`}
        />
      </details>
    </div>
  );
}
