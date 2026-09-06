import { CSSProperties } from "react";
import Image from "next/image";

interface ImageSlotProps {
  label: string;
  className?: string;
  style?: CSSProperties;
  shape?: "rect" | "rounded" | "circle";
  radius?: number;
  tone?: "mauve" | "pink" | "cream" | "purple";
  /** Real photo URL (from a product/post's `imageUrl` column, uploaded via
   * the admin dashboard's photo upload). When present, renders an actual
   * `next/image` instead of the gradient placeholder — the swap the README
   * calls for once photography exists, done per-row instead of all-or-nothing. */
  imageUrl?: string | null;
}

const tones: Record<NonNullable<ImageSlotProps["tone"]>, string> = {
  mauve: "#f6eff8",
  pink: "#f3c6d6",
  cream: "#f5ecd8",
  purple: "#efe3f2",
};

/**
 * Placeholder visual for a product/editorial photo slot.
 * Swap for a real <Image> (next/image) once photography is available —
 * real photos with descriptive alt text meaningfully help image search.
 */
export default function ImageSlot({
  label,
  className = "",
  style,
  shape = "rect",
  radius,
  tone = "mauve",
  imageUrl,
}: ImageSlotProps) {
  const radiusStyle =
    shape === "circle"
      ? "9999px"
      : shape === "rounded"
        ? `${radius ?? 16}px`
        : "8px";

  if (imageUrl) {
    const isDataOrBlob = imageUrl.startsWith("data:") || imageUrl.startsWith("blob:");
    return (
      <div
        className={`relative overflow-hidden select-none ${className}`}
        style={{ borderRadius: radiusStyle, ...style }}
      >
        {isDataOrBlob ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <Image
            src={imageUrl}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover"
            unoptimized={imageUrl.startsWith("http")}
          />
        )}
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`flex items-center justify-center overflow-hidden select-none ${className}`}
      style={{
        background: tones[tone],
        borderRadius: radiusStyle,
        ...style,
      }}
    >
      <span className="text-[11px] font-medium tracking-wide text-purple-deep/40 px-3 text-center leading-snug">
        {label}
      </span>
    </div>
  );
}
