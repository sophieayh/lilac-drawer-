import type { Metadata } from "next";
import FashionCollageBoard from "./FashionCollageBoard";
import { getAllProducts } from "@/db/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Fashion & Moodboard Sandbox — Lilac Drawer",
  description: "Arrange your favorite pieces and custom uploads into an interactive aesthetic moodboard.",
  robots: { index: false, follow: true },
};

export default async function FashionCollagePage() {
  const allProducts = await getAllProducts();
  return <FashionCollageBoard initialProducts={allProducts} />;
}


