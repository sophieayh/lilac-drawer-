import Link from "next/link";
import { getAllCategories } from "@/db/queries";
import { deleteCategory, toggleCategoryActive, moveCategory } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";

export const metadata = { title: "الأقسام والقوائم" };

interface Props {
  searchParams: Promise<{ section?: string }>;
}

export default async function CategoriesPage({ searchParams }: Props) {
  const { section = "all" } = await searchParams;
  const categories = await getAllCategories(section);

  const filterTabs = [
    { label: "جميع الأقسام", value: "all" },
    { label: "شريط التنقل العلوي (قوائم منسدلة)", value: "header" },
    { label: "فلاتر القائمة الجانبية", value: "sidebar" },
    { label: "شبكة استكشف", value: "explore" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl text-purple-deep">الأقسام والقوائم</h1>
          <p className="text-sm text-tan-dark mt-1">
            إدارة الأقسام الرئيسية وفروع الأقسام الفرعية لقوائم وتصفح الموقع.
          </p>
        </div>
        <Link
          href="/categories/new"
          className="bg-lilac text-white rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_2px_8px_rgba(201,163,198,0.4)] hover:bg-lilac/90 transition-colors"
        >
          + إضافة قسم جديد
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const isActive = section === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === "all" ? "/categories" : `/categories?section=${tab.value}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-purple-deep text-white shadow-[0_2px_8px_rgba(90,47,69,0.25)]"
                  : "bg-white border border-border text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Categories Table / Cards */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-right text-xs uppercase tracking-wide text-tan-dark bg-mauve-50/50">
              <th className="px-4 py-3.5 font-semibold w-12 text-center">الترتيب</th>
              <th className="px-4 py-3.5 font-semibold">القسم</th>
              <th className="px-4 py-3.5 font-semibold">الموضع</th>
              <th className="px-4 py-3.5 font-semibold">الأقسام الفرعية</th>
              <th className="px-4 py-3.5 font-semibold">الرابط المباشر</th>
              <th className="px-4 py-3.5 font-semibold">الحالة</th>
              <th className="px-4 py-3.5 font-semibold text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c, idx) => {
              const branches = Array.isArray(c.subcategories) ? c.subcategories : [];
              return (
                <tr key={c.id} className="border-b border-border last:border-b-0 align-top hover:bg-mauve-50/25 transition-colors">
                  {/* Reordering column */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <form action={moveCategory.bind(null, c.id, "up")}>
                        <button
                          type="submit"
                          disabled={idx === 0}
                          title="نقل لأعلى"
                          className="p-1 rounded hover:bg-mauve-100 text-tan-dark hover:text-purple-deep disabled:opacity-20 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      </form>
                      <span className="text-[11px] font-bold text-tan-dark/70">{c.sortOrder}</span>
                      <form action={moveCategory.bind(null, c.id, "down")}>
                        <button
                          type="submit"
                          disabled={idx === categories.length - 1}
                          title="نقل لأسفل"
                          className="p-1 rounded hover:bg-mauve-100 text-tan-dark hover:text-purple-deep disabled:opacity-20 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </form>
                    </div>
                  </td>

                  {/* Category info */}
                  <td className="px-4 py-3 font-medium text-purple-deep">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-purple-deep shadow-sm shrink-0"
                        style={{ backgroundColor: c.colorHex || "#f6eff8" }}
                      >
                        {c.label.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="font-bold text-purple-deep text-sm">{c.label}</div>
                        <div className="text-xs text-tan-dark font-mono mt-0.5">/{c.slug || "بدون-معرف"}</div>
                      </div>
                    </div>
                  </td>

                  {/* Section badge */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        c.section === "header"
                          ? "bg-lilac/20 text-purple-deep"
                          : c.section === "sidebar"
                          ? "bg-sage/20 text-emerald-800"
                          : "bg-gold/20 text-amber-900"
                      }`}
                    >
                      {c.section === "header" ? "شريط علوي" : c.section === "sidebar" ? "شريط جانبي" : "استكشف"}
                    </span>
                  </td>

                  {/* Subcategories preview */}
                  <td className="px-4 py-3 max-w-[300px]">
                    {branches.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold bg-mauve-100 text-purple-deep px-2 py-0.5 rounded-full">
                            {branches.length} {branches.length === 1 ? "فرع" : "فروع"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {branches.slice(0, 3).map((sub, i) => (
                            <span
                              key={sub.id || i}
                              className="text-[11px] bg-mauve-50 border border-border px-2 py-0.5 rounded-md text-purple-deep/90"
                              title={sub.description || sub.href}
                            >
                              {sub.label}
                            </span>
                          ))}
                          {branches.length > 3 && (
                            <span className="text-[11px] text-tan-dark self-center">
                              +{branches.length - 3} أخرى
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-tan-dark italic">لا توجد فروع (رابط مباشر)</span>
                    )}
                  </td>

                  {/* Direct Link */}
                  <td className="px-4 py-3 text-xs font-mono text-tan-dark max-w-[150px] truncate">
                    {c.href || "—"}
                  </td>

                  {/* Active / Inactive Toggle */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <form action={toggleCategoryActive.bind(null, c.id, !c.isActive)}>
                      <button
                        type="submit"
                        className={`text-xs font-semibold rounded-full px-3 py-1 cursor-pointer transition-colors ${
                          c.isActive
                            ? "bg-sage/20 text-emerald-800 hover:bg-sage/30"
                            : "bg-rose/15 text-rose hover:bg-rose/25"
                        }`}
                      >
                        {c.isActive ? "● نشط" : "○ معطل"}
                      </button>
                    </form>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center justify-start gap-3 whitespace-nowrap">
                      <Link
                        href={`/categories/${c.id}/edit`}
                        className="text-xs font-bold text-purple-deep hover:text-lilac transition-colors"
                      >
                        تعديل
                      </Link>
                      <DeleteButton
                        action={deleteCategory.bind(null, c.id)}
                        confirmMessage={`هل أنت متأكد من حذف قسم "${c.label}"؟ سيؤدي ذلك لإزالته من القوائم.`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}

            {categories.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-tan-dark">
                  لم يتم العثور على أقسام في هذا الموضع. اضغط &quot;+ إضافة قسم جديد&quot; لإنشاء قسم.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
