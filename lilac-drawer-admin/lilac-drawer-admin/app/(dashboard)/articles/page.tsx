import Link from "next/link";
import { getAllPosts, formatDate } from "@/db/queries";
import { deleteArticle } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";
import OrderButtons from "@/components/OrderButtons";
import PublishToggle from "@/components/PublishToggle";

export const metadata = { title: "المقالات" };

export default async function ArticlesPage() {
  const items = await getAllPosts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl text-purple-deep">المقالات والمراجعات</h1>
          <p className="text-sm text-tan-dark mt-1">
            {items.length} إجمالي · {items.filter((p) => p.isPublished).length} منشور. استخدم الأسهم لتحديد ترتيب العرض.
          </p>
        </div>
        <Link href="/articles/new" className="bg-lilac text-white rounded-full px-5 py-2.5 text-sm font-semibold">
          + كتابة مقال جديد
        </Link>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-right text-xs uppercase tracking-wide text-tan-dark">
              <th className="px-4 py-3 font-semibold">الترتيب</th>
              <th className="px-4 py-3 font-semibold">العنوان</th>
              <th className="px-4 py-3 font-semibold">القسم</th>
              <th className="px-4 py-3 font-semibold">تاريخ النشر</th>
              <th className="px-4 py-3 font-semibold">الحالة</th>
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
                      تعديل
                    </Link>
                    <DeleteButton
                      action={deleteArticle.bind(null, p.id)}
                      confirmMessage={`هل أنت متأكد من حذف "${p.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-tan-dark">
                  لا توجد مقالات بعد — ابدأ بكتابة أول مقال لك.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
