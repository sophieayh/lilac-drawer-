"use client";

import { useState } from "react";
import Link from "next/link";
import type { SubCategoryItem } from "@/db/schema";

interface CategoryData {
  id?: number;
  label?: string;
  slug?: string | null;
  icon?: string | null;
  colorHex?: string | null;
  href?: string | null;
  section?: string;
  subcategories?: SubCategoryItem[] | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface Props {
  initial?: CategoryData | null;
  action: (formData: FormData) => Promise<void>;
  title: string;
  submitLabel: string;
}

export default function CategoryForm({ initial, action, title, submitLabel }: Props) {
  const [subcategories, setSubcategories] = useState<SubCategoryItem[]>(
    Array.isArray(initial?.subcategories) ? initial.subcategories : []
  );

  const addSubcategory = () => {
    const newItem: SubCategoryItem = {
      id: `sub-${Date.now().toString(36)}`,
      label: "",
      href: "/deals",
      description: "",
    };
    setSubcategories([...subcategories, newItem]);
  };

  const updateSubcategory = (index: number, field: keyof SubCategoryItem, value: string) => {
    const updated = [...subcategories];
    updated[index] = { ...updated[index], [field]: value };
    setSubcategories(updated);
  };

  const removeSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const moveSubcategory = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === subcategories.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...subcategories];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSubcategories(updated);
  };

  return (
    <form action={action} className="flex flex-col gap-8 max-w-[840px]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl text-purple-deep">{title}</h1>
          <p className="text-sm text-tan-dark mt-1">
            Configure category details, placement section, and subcategory branches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/categories"
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-purple-deep hover:bg-mauve-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-lilac text-white rounded-full px-6 py-2 text-sm font-semibold shadow-[0_2px_8px_rgba(201,163,198,0.4)] hover:bg-lilac/90 transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </div>

      {/* Hidden subcategories JSON string */}
      <input type="hidden" name="subcategories" value={JSON.stringify(subcategories)} />

      {/* Primary info card */}
      <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-[var(--shadow-card)]">
        <h2 className="font-heading text-lg text-purple-deep border-b border-border pb-3">
          Category Basics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="label" className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              Category Name *
            </label>
            <input
              id="label"
              name="label"
              type="text"
              required
              defaultValue={initial?.label ?? ""}
              placeholder="e.g. Beauty & Makeup"
              className="w-full rounded-xl border border-border bg-mauve-50/40 px-3.5 py-2.5 text-sm text-purple-deep focus:outline-none focus:ring-2 focus:ring-lilac/50"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              Slug (URL Identifier)
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              defaultValue={initial?.slug ?? ""}
              placeholder="e.g. beauty-makeup"
              className="w-full rounded-xl border border-border bg-mauve-50/40 px-3.5 py-2.5 text-sm text-purple-deep focus:outline-none focus:ring-2 focus:ring-lilac/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label htmlFor="section" className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              Menu Section *
            </label>
            <select
              id="section"
              name="section"
              defaultValue={initial?.section ?? "header"}
              className="w-full rounded-xl border border-border bg-mauve-50/40 px-3.5 py-2.5 text-sm text-purple-deep focus:outline-none focus:ring-2 focus:ring-lilac/50"
            >
              <option value="header">Header Navigation (With Hover Menu)</option>
              <option value="sidebar">Sidebar Filter Menu</option>
              <option value="explore">Explore Grid</option>
            </select>
          </div>

          <div>
            <label htmlFor="icon" className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              Icon / Symbol (Optional)
            </label>
            <input
              id="icon"
              name="icon"
              type="text"
              defaultValue={initial?.icon ?? ""}
              placeholder="Optional"
              className="w-full rounded-xl border border-border bg-mauve-50/40 px-3.5 py-2.5 text-sm text-purple-deep focus:outline-none focus:ring-2 focus:ring-lilac/50"
            />
          </div>

          <div>
            <label htmlFor="colorHex" className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              Badge Color (Hex)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="colorHex"
                name="colorHex"
                type="text"
                defaultValue={initial?.colorHex ?? "#f3c6d6"}
                placeholder="#f3c6d6"
                className="w-full rounded-xl border border-border bg-mauve-50/40 px-3.5 py-2.5 text-sm text-purple-deep focus:outline-none focus:ring-2 focus:ring-lilac/50"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              Category Route
            </label>
            <div className="w-full rounded-xl border border-border bg-mauve-50/20 px-3.5 py-2.5 text-xs text-tan-dark font-mono flex items-center gap-2">
              <span className="text-rose">/category/</span>
              <span>[slug]</span>
              <span className="ml-auto text-[10px] uppercase font-bold bg-lilac/20 text-purple-deep px-2 py-0.5 rounded">
                Auto Filtered
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="sortOrder" className="block text-xs font-bold uppercase tracking-wider text-tan-dark mb-1.5">
              Display Sort Order
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={initial?.sortOrder ?? 0}
              className="w-full rounded-xl border border-border bg-mauve-50/40 px-3.5 py-2.5 text-sm text-purple-deep focus:outline-none focus:ring-2 focus:ring-lilac/50"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initial?.isActive ?? true}
              className="w-4 h-4 rounded text-lilac focus:ring-lilac accent-purple-deep"
            />
            <span className="text-sm font-semibold text-purple-deep">Active and Visible on Site</span>
          </label>
        </div>
      </div>

      {/* Subcategories / Branches Manager */}
      <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-lg text-purple-deep">
              Subcategories
            </h2>
            <p className="text-xs text-tan-dark mt-1">
              Configure branch subcategories. Articles and products will automatically filter by these branches.
            </p>
          </div>
          <button
            type="button"
            onClick={addSubcategory}
            className="flex items-center gap-2 bg-mauve-100 hover:bg-mauve-200 text-purple-deep px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            + Add Subcategory
          </button>
        </div>

        {subcategories.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-border bg-mauve-50/30">
            <p className="text-sm text-tan-dark">No subcategories configured yet.</p>
            <p className="text-xs text-tan-dark/70 mt-1">
              Click &quot;+ Add Subcategory&quot; to create branch items.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {subcategories.map((sub, idx) => (
              <div
                key={sub.id || idx}
                className="p-4 rounded-xl border border-border bg-mauve-50/30 flex flex-col gap-3 relative group"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-deep text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-purple-deep">
                      {sub.label || `Item #${idx + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveSubcategory(idx, "up")}
                      disabled={idx === 0}
                      title="Move up"
                      className="p-1 rounded text-tan-dark hover:text-purple-deep hover:bg-white disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSubcategory(idx, "down")}
                      disabled={idx === subcategories.length - 1}
                      title="Move down"
                      className="p-1 rounded text-tan-dark hover:text-purple-deep hover:bg-white disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSubcategory(idx)}
                      title="Remove branch"
                      className="p-1 rounded text-rose hover:bg-rose/10 ml-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-tan-dark mb-1">
                      Subcategory Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={sub.label}
                      onChange={(e) => updateSubcategory(idx, "label", e.target.value)}
                      placeholder="e.g. Makeup Essentials"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-purple-deep focus:outline-none focus:ring-2 focus:ring-lilac/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-tan-dark mb-1">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={sub.description || ""}
                      onChange={(e) => updateSubcategory(idx, "description", e.target.value)}
                      placeholder="e.g. Foundations, blushes & setting sprays tested for all-day wear"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-purple-deep focus:outline-none focus:ring-2 focus:ring-lilac/50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/categories"
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-purple-deep hover:bg-mauve-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="bg-lilac text-white rounded-full px-7 py-2.5 text-sm font-semibold shadow-[0_2px_8px_rgba(201,163,198,0.4)] hover:bg-lilac/90 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
