import Link from "next/link";
import { getAllCategories } from "@/db/queries";
import { deleteCategory, toggleCategoryActive, moveCategory } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";

export const metadata = { title: "Categories & Menus" };

interface Props {
  searchParams: Promise<{ section?: string }>;
}

export default async function CategoriesPage({ searchParams }: Props) {
  const { section = "all" } = await searchParams;
  const categories = await getAllCategories(section);

  const filterTabs = [
    { label: "All Categories", value: "all" },
    { label: "Header Nav (Hover Dropdowns)", value: "header" },
    { label: "Sidebar Filters", value: "sidebar" },
    { label: "Explore Grid", value: "explore" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl text-purple-deep">Categories & Menus</h1>
          <p className="text-sm text-tan-dark mt-1">
            Manage main categories and their subcategory branches for the website navigation and menus.
          </p>
        </div>
        <Link
          href="/categories/new"
          className="bg-lilac text-white rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_2px_8px_rgba(201,163,198,0.4)] hover:bg-lilac/90 transition-colors"
        >
          + Add Category
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
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-tan-dark bg-mauve-50/50">
              <th className="px-4 py-3.5 font-semibold w-12 text-center">Order</th>
              <th className="px-4 py-3.5 font-semibold">Category</th>
              <th className="px-4 py-3.5 font-semibold">Section</th>
              <th className="px-4 py-3.5 font-semibold">Subcategories</th>
              <th className="px-4 py-3.5 font-semibold">Direct Link</th>
              <th className="px-4 py-3.5 font-semibold">Status</th>
              <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
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
                          title="Move Up"
                          className="p-1 rounded hover:bg-mauve-100 text-tan-dark hover:text-purple-deep disabled:opacity-20"
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
                          title="Move Down"
                          className="p-1 rounded hover:bg-mauve-100 text-tan-dark hover:text-purple-deep disabled:opacity-20"
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
                        <div className="text-xs text-tan-dark font-mono mt-0.5">/{c.slug || "no-slug"}</div>
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
                      {c.section}
                    </span>
                  </td>

                  {/* Subcategories preview */}
                  <td className="px-4 py-3 max-w-[300px]">
                    {branches.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold bg-mauve-100 text-purple-deep px-2 py-0.5 rounded-full">
                            {branches.length} {branches.length === 1 ? "branch" : "branches"}
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
                              +{branches.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-tan-dark italic">No branches (Direct link)</span>
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
                        {c.isActive ? "● Active" : "○ Inactive"}
                      </button>
                    </form>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                      <Link
                        href={`/categories/${c.id}/edit`}
                        className="text-xs font-bold text-purple-deep hover:text-lilac transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteCategory.bind(null, c.id)}
                        confirmMessage={`Delete category "${c.label}"? This will remove its menu placement.`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}

            {categories.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-tan-dark">
                  No categories found in this section. Click &quot;+ Add Category&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
