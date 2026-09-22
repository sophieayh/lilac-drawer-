import type { Metadata } from "next";
import FashionCollageBoard, { type SharedCollageInfo } from "./FashionCollageBoard";
import { getAllProducts, getPostById } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fashion & Moodboard Sandbox — Lilac Drawer",
  description: "Arrange your favorite pieces and custom uploads into an interactive aesthetic moodboard.",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams?: Promise<{ post?: string }>;
}

export default async function FashionCollagePage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const postId = params?.post ? Number(params.post) : null;

  const [allProducts, sharedPost] = await Promise.all([
    getAllProducts(),
    postId && Number.isFinite(postId) ? getPostById(postId) : Promise.resolve(null),
  ]);

  const sharedCollage: SharedCollageInfo | null =
    sharedPost && sharedPost.collageData
      ? {
          postId: sharedPost.id,
          authorName: sharedPost.authorName,
          authorHandle: sharedPost.authorHandle,
          authorImage: sharedPost.authorImage,
          body: sharedPost.body,
          collageData: sharedPost.collageData,
        }
      : null;

  return (
    <FashionCollageBoard
      initialProducts={allProducts}
      sharedCollage={sharedCollage}
    />
  );
}
