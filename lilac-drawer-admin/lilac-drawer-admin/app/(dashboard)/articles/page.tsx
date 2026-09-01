import Link from "next/link";
import { getAllPosts, formatDate } from "@/db/queries";
import { deleteArticle } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";
import OrderButtons from "@/components/OrderButtons";
import PublishToggle from "@/components/PublishToggle";

export const metadata = { title: "Articles" };

export default async function ArticlesPage() {
  const items = await getAllPosts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl text-purple-deep">Articles</h1>
          <p className="text-sm text-tan-dark mt-1">
            {items.length} total · {items.filter((p) => p.isPublished).length} published. Use the arrows to set display order.
          </p>
        </div>
        <Link href="/articles/new" className="bg-lilac text-white rounded-full px-5 py-2.5 text-sm font-semibold">
          + Write article
        </Link>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-tan-dark">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Published</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {items.map((p, i) => (
              <tr key={p.id} className="border-b border-border last:border-b-0 align-top">
                <td className="px-4 py-3">
                  <OrderButtons id={p.id} disableUp={i === 0} disableDown={i === items.length - 1} />
                </td>
                <td className="px-4 py-3 font-medium text-purple-deep max-w-[260px]">
                  {p.title}
                  <p className="text-xs text-tan-dark font-normal">/blog/{p.slug}</p>
                </td>
                <td className="px-4 py-3 text-tan-dark whitespace-nowrap">{p.category}</td>
                <td className="px-4 py-3 text-tan-dark whitespace-nowrap">{formatDate(p.publishedAt)}</td>
                <td className="px-4 py-3">
                  <PublishToggle id={p.id} isPublished={p.isPublished} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link href={`/articles/${p.id}/edit`} className="text-xs font-semibold text-purple-deep hover:underline">
                      Edit
                    </Link>
                    <DeleteButton
                      action={deleteArticle.bind(null, p.id)}
                      confirmMessage={`Delete "${p.title}"? This can't be undone.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-tan-dark">
                  No articles yet — write your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
