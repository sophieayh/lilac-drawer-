import type { Metadata } from "next";
import FashionCollageBoard from "./FashionCollageBoard";

export const metadata: Metadata = {
  title: "Fashion Collage",
  description: "Arrange your favorite pieces into a moodboard.",
  robots: { index: false, follow: true },
};

export default function FashionCollagePage() {
  return <FashionCollageBoard />;
}
