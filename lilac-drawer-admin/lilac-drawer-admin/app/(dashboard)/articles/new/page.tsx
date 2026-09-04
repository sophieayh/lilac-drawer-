import Link from "next/link";
import ArticleForm from "../ArticleForm";
import { createArticle } from "@/lib/actions";
import { getAllProducts, getAllCategories } from "@/db/queries";

export const metadata = { title: "Write Article" };

export default async function NewArticlePage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/articles" className="text-xs font-semibold text-rose hover:underline">
          ← Articles
        </Link>
        <h1 className="font-heading text-2xl text-purple-deep mt-1">Write a new article</h1>
      </div>
      <ArticleForm
        availableProducts={products}
        availableCategories={categories}
        action={createArticle}
      />
    </div>
  );
}
