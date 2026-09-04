import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleForm from "../../ArticleForm";
import { getPostById, getAllProducts, getAllCategories } from "@/db/queries";
import { updateArticle } from "@/lib/actions";

export const metadata = { title: "Edit Article" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, products, categories] = await Promise.all([
    getPostById(Number(id)),
    getAllProducts(),
    getAllCategories(),
  ]);
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/articles" className="text-xs font-semibold text-rose hover:underline">
          ← Articles
        </Link>
        <h1 className="font-heading text-2xl text-purple-deep mt-1">Edit article</h1>
      </div>
      <ArticleForm
        post={post}
        availableProducts={products}
        availableCategories={categories}
        action={updateArticle.bind(null, post.id)}
      />
    </div>
  );
}
