import Link from "next/link";
import StatCard from "@/components/StatCard";
import { getDashboardStats, getVisitsByDay, getVisitsToday } from "@/db/queries";

export const metadata = { title: "نظرة عامة" };

export default async function OverviewPage() {
  const [stats, visitsByDay, visitsToday] = await Promise.all([
    getDashboardStats(),
    getVisitsByDay(14),
    getVisitsToday(),
  ]);

  const maxDay = Math.max(1, ...visitsByDay.map((d) => d.count));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl text-purple-deep">نظرة عامة</h1>
        <p className="text-sm text-tan-dark mt-1">ملخص شامل للمستخدمين، المحتوى، وحركة الزوار عبر الموقع.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="المستخدمون" value={stats.userCount} />
        <StatCard
          label="المقالات"
          value={stats.postCount}
          hint={`${stats.publishedPostCount} منشور · ${stats.postCount - stats.publishedPostCount} مسودة`}
        />
        <StatCard label="المنتجات وروابط الأفلييت" value={stats.productCount} />
        <StatCard label="إجمالي الزيارات" value={stats.totalVisits} hint={`${visitsToday} اليوم`} />
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-heading text-lg text-purple-deep mb-4">الزيارات — آخر 14 يوماً</h2>
        <div className="flex items-end gap-2 h-32">
          {visitsByDay.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full bg-lilac rounded-t-sm min-h-[2px]"
                style={{ height: `${Math.max(2, (d.count / maxDay) * 100)}%` }}
                title={`${d.day}: ${d.count} زيارة`}
              />
              <span className="text-[10px] text-tan-dark">{d.day.slice(5)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-tan-dark mt-3">
          مستخرجة من جدول <code>page_views</code> في قاعدة بيانات الموقع العام — يتم تسجيلها تلقائياً مع كل زيارة.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/articles/new" className="bg-white border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] card-hover">
          <p className="font-heading text-base text-purple-deep">كتابة مقال جديد ←</p>
          <p className="text-xs text-tan-dark mt-1">إنشاء مسودات، نشر، وترتيب المقالات في المدونة.</p>
        </Link>
        <Link href="/products/new" className="bg-white border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] card-hover">
          <p className="font-heading text-base text-purple-deep">إضافة رابط أفلييت ←</p>
          <p className="text-xs text-tan-dark mt-1">إضافة منتج جديد برابط الإحالة أو المتجر.</p>
        </Link>
        <Link href="/users" className="bg-white border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] card-hover">
          <p className="font-heading text-base text-purple-deep">إدارة المستخدمين ←</p>
          <p className="text-xs text-tan-dark mt-1">استعراض الحسابات ومنح وتعديل صلاحيات المشرفين.</p>
        </Link>
      </div>
    </div>
  );
}
