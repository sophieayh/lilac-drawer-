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
  mauve: "linear-gradient(150deg, #efe3f2, #f6eff8)",
  pink: "linear-gradient(150deg, #f9d6e4, #f3c6d6)",
  cream: "linear-gradient(150deg, #f5ecd8, #fbf6f0)",
  purple: "linear-gradient(150deg, #e6d9f0, #d4a5d8)",
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
    return (
      <div
        className={`relative overflow-hidden select-none ${className}`}
        style={{ borderRadius: radiusStyle, ...style }}
      >
        <Image src={imageUrl} alt={label} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" />
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
