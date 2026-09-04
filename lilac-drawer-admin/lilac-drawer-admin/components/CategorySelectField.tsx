"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { siteCategories, SubCategoryItem } from "@/db/schema";

type SiteCategory = typeof siteCategories.$inferSelect;

interface Props {
  name?: string;
  label?: string;
  initialValue?: string | string[] | null;
  availableCategories: SiteCategory[];
  required?: boolean;
  helperText?: string;
}

interface FlattenedOption {
  label: string;
  group: string;
  isSubcategory: boolean;
  section: string;
}

export default function CategorySelectField({
  name = "category",
  label = "Category *",
  initialValue,
  availableCategories = [],
  required = true,
  helperText,
}: Props) {
  // Parse initial selected categories
  const initialList = useMemo(() => {
    if (!initialValue) return [];
    if (Array.isArray(initialValue)) return initialValue.filter(Boolean);
    return initialValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [initialValue]);

  const [selected, setSelected] = useState<string[]>(initialList);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build flattened options from database categories and their branches
  const options = useMemo(() => {
    const list: FlattenedOption[] = [];
    const seen = new Set<string>();

    availableCategories.forEach((cat) => {
      // Main category
      if (cat.label && !seen.has(cat.label.toLowerCase())) {
        seen.add(cat.label.toLowerCase());
        list.push({
          label: cat.label,
          group: cat.label,
          isSubcategory: false,
          section: cat.section,
        });
      }

      // Subcategories / Branches
      const branches: SubCategoryItem[] = Array.isArray(cat.subcategories) ? cat.subcategories : [];
      branches.forEach((b) => {
        if (b.label && !seen.has(b.label.toLowerCase())) {
          seen.add(b.label.toLowerCase());
          list.push({
            label: b.label,
            group: cat.label,
            isSubcategory: true,
            section: cat.section,
          });
        }
      });
    });

    // Also include default editorial categories if not in list
    const defaults = ["REVIEWS", "CARE", "GUIDES", "STORIES"];
    defaults.forEach((d) => {
      if (!seen.has(d.toLowerCase())) {
        seen.add(d.toLowerCase());
        list.push({
          label: d,
          group: "Editorial Content",
          isSubcategory: false,
          section: "editorial",
        });
      }
    });

    return list;
  }, [availableCategories]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.group.toLowerCase().includes(q) ||
        opt.section.toLowerCase().includes(q)
    );
  }, [options, search]);

  const toggleCategory = (catLabel: string) => {
    if (selected.includes(catLabel)) {
      setSelected(selected.filter((item) => item !== catLabel));
    } else {
      setSelected([...selected, catLabel]);
    }
  };

  const removeCategory = (catLabel: string) => {
    setSelected(selected.filter((item) => item !== catLabel));
  };

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-purple-deep">
          {label}
        </label>
        {selected.length > 0 && (
          <span className="text-[11px] font-bold text-lilac bg-lilac/10 px-2 py-0.5 rounded-full">
            {selected.length} {selected.length === 1 ? "category selected" : "categories selected"}
          </span>
        )}
      </div>

      {/* Hidden input storing primary / joined value for standard HTML form submission */}
      <input
        type="hidden"
        name={name}
        value={selected.join(", ")}
        required={required}
      />
      <input
        type="hidden"
        name="topicLabel"
        value={selected[1] || selected[0] || ""}
      />

      {/* Selected tags display */}
      <div
        className={`min-h-[46px] p-2 rounded-xl border bg-white flex flex-wrap items-center gap-1.5 transition-colors cursor-pointer ${
          isOpen
            ? "border-lilac ring-2 ring-lilac/20"
            : selected.length === 0 && required
            ? "border-border hover:border-lilac/60"
            : "border-border"
        }`}
        onClick={() => setIsOpen(true)}
      >
        {selected.length === 0 ? (
          <div className="flex items-center justify-between w-full px-2 text-sm text-tan-dark/70 select-none">
            <span>Select category...</span>
            <svg className="w-4 h-4 text-tan-dark/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        ) : (
          <>
            {selected.map((catLabel, idx) => (
              <span
                key={catLabel}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg shadow-sm animate-in fade-in duration-150 ${
                  idx === 0
                    ? "bg-purple-deep text-white"
                    : "bg-mauve-100 text-purple-deep border border-border"
                }`}
              >
                <span>{catLabel}</span>
                {idx === 0 && (
                  <span className="text-[10px] bg-white/20 px-1 rounded text-white font-normal">Primary</span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCategory(catLabel);
                  }}
                  className="hover:opacity-75 focus:outline-none ml-0.5"
                  aria-label={`Remove ${catLabel}`}
                >
                  ✕
                </button>
              </span>
            ))}
            <div className="ml-auto text-xs text-tan-dark pr-2">
              {isOpen ? "▲" : "▼"}
            </div>
          </>
        )}
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-white border border-border rounded-2xl shadow-[0_16px_36px_rgba(90,47,69,0.15)] p-3 flex flex-col gap-2 max-h-[340px] overflow-hidden">
            {/* Search filter input inside dropdown */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                autoFocus
                className="w-full rounded-xl border border-border bg-mauve-50/50 px-3.5 py-2 text-xs text-purple-deep focus:outline-none focus:ring-2 focus:ring-lilac/40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2 text-xs text-tan-dark hover:text-purple-deep"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Scrollable list */}
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[260px] pr-1 divide-y divide-border/40">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-tan-dark">
                  No matching category found.
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = selected.includes(opt.label);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => toggleCategory(opt.label)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-lilac/15 text-purple-deep font-bold"
                          : "hover:bg-mauve-50 text-purple-deep/90"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isSelected
                              ? "bg-purple-deep border-purple-deep text-white"
                              : "border-border bg-white"
                          }`}
                        >
                          {isSelected && "✓"}
                        </span>
                        <div className="flex flex-col">
                          <span className={opt.isSubcategory ? "pl-3 text-purple-deep/90" : "font-semibold"}>
                            {opt.isSubcategory ? `↳ ${opt.label}` : opt.label}
                          </span>
                          {!opt.isSubcategory && opt.group && (
                            <span className="text-[10px] text-tan-dark font-normal">
                              {opt.section}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-tan-dark/70 tracking-wider">
                        {opt.isSubcategory ? "Branch" : opt.section}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Dropdown footer info */}
            <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-tan-dark px-1">
              <span>Selected: {selected.length}</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-mauve-100 hover:bg-mauve-200 text-purple-deep font-bold px-3 py-1 rounded-lg text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation warning if required and empty */}
      {required && selected.length === 0 && (
        <p className="text-[11px] text-rose font-semibold">
          * Please select at least one category.
        </p>
      )}

      {helperText && <p className="text-xs text-tan-dark">{helperText}</p>}
    </div>
  );
}
