"use client";

import { useState } from "react";
import { slugify } from "@/lib/slugify";
import ImageUploadField from "@/components/ImageUploadField";
import type { posts } from "@/db/schema";

type Post = typeof posts.$inferSelect;

const CATEGORIES = ["REVIEWS", "CARE", "GUIDES", "STORIES"] as const;

const PLACEMENT_FLAGS: { key: keyof Post; label: string }[] = [
  { key: "isNewHome", label: "Home — New + Updated" },
  { key: "isHomePreview", label: "Home — From the Blog" },
  { key: "isHomeReview", label: "Home — Latest Reviews" },
  { key: "isRecentBlog", label: "Blog — Latest Posts" },
  { key: "isSideStory", label: "Blog — Side column" },
  { key: "isDealsPreview", label: "Deals — Latest Blog" },
];

export default function ArticleForm({ post, action }: { post?: Post; action: (formData: FormData) => Promise<void> }) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  const field = "w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lilac";
  const labelCls = "block text-xs font-semibold text-purple-deep mb-1.5";

  return (
    <form action={action} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="title">
            Title
          </label>
          <input id="title" name="title" required value={title} onChange={(e) => handleTitleChange(e.target.value)} className={field} />
        </div>
        <div>
          <label className={labelCls} htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={field}
          />
          <p className="text-xs text-tan-dark mt-1">URL: /blog/{slug || "…"}</p>
        </div>
        <div>
          <label className={labelCls} htmlFor="category">
            Category
          </label>
          <select id="category" name="category" defaultValue={post?.category ?? "REVIEWS"} required className={field}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="excerpt">
            Excerpt
          </label>
          <textarea id="excerpt" name="excerpt" required rows={2} defaultValue={post?.excerpt ?? ""} className={field} />
          <p className="text-xs text-tan-dark mt-1">Shown on cards/teasers across the site and used for the meta description.</p>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="body">
            Article body
          </label>
          <textarea id="body" name="body" rows={14} defaultValue={post?.body ?? ""} className={`${field} font-mono text-xs leading-relaxed`} />
          <p className="text-xs text-tan-dark mt-1">Separate paragraphs with a blank line. Wrap text in **double asterisks** for bold.</p>
        </div>
      </div>

      <div className="border-t border-border pt-5 grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="topicLabel">
            Topic label <span className="text-tan-dark font-normal normal-case">(optional, e.g. &quot;Wardrobe&quot;)</span>
          </label>
          <input id="topicLabel" name="topicLabel" defaultValue={post?.topicLabel ?? ""} className={field} />
        </div>
        <div>
          <label className={labelCls} htmlFor="author">
            Author
          </label>
          <input id="author" name="author" defaultValue={post?.author ?? "the Lilac Drawer editors"} className={field} />
        </div>
        <div>
          <label className={labelCls} htmlFor="imageLabel">
            Image alt text
          </label>
          <input id="imageLabel" name="imageLabel" defaultValue={post?.imageLabel ?? ""} className={field} />
        </div>
        <div>
          <label className={labelCls} htmlFor="imageUrl">
            Photo
          </label>
          <ImageUploadField name="imageUrl" defaultValue={post?.imageUrl} kind="articles" />
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-purple-deep">
          <input type="checkbox" name="isPublished" defaultChecked={post?.isPublished ?? false} className="size-4" />
          Publish this article on the site
        </label>
        <p className="text-xs text-tan-dark mt-1 ml-6">
          Leave unchecked to save as a draft — it stays invisible on the public site until you publish it.
        </p>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-semibold text-purple-deep uppercase tracking-wide mb-3">Where it appears on the site</p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {PLACEMENT_FLAGS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-purple-deep">
              <input type="checkbox" name={key} defaultChecked={Boolean(post?.[key])} className="size-4" />
              {label}
            </label>
          ))}
        </div>
        <p className="text-xs text-tan-dark mt-2">
          Every article automatically appears in its category grid on /blog. These checkboxes place it in extra featured spots too.
        </p>
      </div>

      <button type="submit" className="bg-lilac text-white rounded-full py-3 font-semibold text-sm self-start px-8">
        {post ? "Save changes" : "Create article"}
      </button>
    </form>
  );
}
