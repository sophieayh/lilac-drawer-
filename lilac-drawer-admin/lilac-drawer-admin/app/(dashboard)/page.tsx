import Link from "next/link";
import StatCard from "@/components/StatCard";
import { getDashboardStats, getVisitsByDay, getVisitsToday } from "@/db/queries";

export const metadata = { title: "Overview" };

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
        <h1 className="font-heading text-2xl text-purple-deep">Overview</h1>
        <p className="text-sm text-tan-dark mt-1">A snapshot of users, content, and traffic across the site.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Users" value={stats.userCount} />
        <StatCard
          label="Articles"
          value={stats.postCount}
          hint={`${stats.publishedPostCount} published · ${stats.postCount - stats.publishedPostCount} draft`}
        />
        <StatCard label="Products / Affiliate Links" value={stats.productCount} />
        <StatCard label="Total Visits" value={stats.totalVisits} hint={`${visitsToday} today`} />
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-heading text-lg text-purple-deep mb-4">Visits — last 14 days</h2>
        <div className="flex items-end gap-2 h-32">
          {visitsByDay.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full bg-lilac rounded-t-sm min-h-[2px]"
                style={{ height: `${Math.max(2, (d.count / maxDay) * 100)}%` }}
                title={`${d.day}: ${d.count} visits`}
              />
              <span className="text-[10px] text-tan-dark">{d.day.slice(5)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-tan-dark mt-3">
          Sourced from the public site&apos;s <code>page_views</code> table — same database, logged there on every page view.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/articles/new" className="bg-white border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] card-hover">
          <p className="font-heading text-base text-purple-deep">Write a new article →</p>
          <p className="text-xs text-tan-dark mt-1">Draft, publish, and order posts on the blog.</p>
        </Link>
        <Link href="/products/new" className="bg-white border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] card-hover">
          <p className="font-heading text-base text-purple-deep">Add an affiliate link →</p>
          <p className="text-xs text-tan-dark mt-1">Add a product with its affiliate/API link.</p>
        </Link>
        <Link href="/users" className="bg-white border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] card-hover">
          <p className="font-heading text-base text-purple-deep">Manage users →</p>
          <p className="text-xs text-tan-dark mt-1">View accounts and grant admin access.</p>
        </Link>
      </div>
    </div>
  );
}
