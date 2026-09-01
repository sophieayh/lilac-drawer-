import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import JsonLd from "@/components/JsonLd";
import ShareButton from "./ShareButton";
import { slugify } from "@/lib/slugify";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts, formatDate } from "@/db/queries";

// ISR: revalidate DB-backed content every 60s instead of only at build/deploy time.
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
  });
}

type ArticleSection = {
  id: string;
  heading: string | null;
  paragraphs: string[];
};

/**
 * Splits the plain-text body into sections. A paragraph block consisting of
 * exactly `## Heading text` starts a new section (with an anchor id, used
 * for the "In this guide" sidebar TOC); everything else is a paragraph in
 * whichever section is currently open. Existing articles with no `##`
 * lines simply produce one unheaded section — fully backward compatible.
 */
function parseArticleBody(body: string): ArticleSection[] {
  const blocks = body.trim().split(/\n\s*\n/);
  const sections: ArticleSection[] = [];
  let current: ArticleSection = { id: "", heading: null, paragraphs: [] };

  for (const block of blocks) {
    const headingMatch = block.trim().match(/^##\s+(.+)$/);
    if (headingMatch) {
      if (current.heading || current.paragraphs.length > 0) sections.push(current);
      const heading = headingMatch[1].trim();
      current = { id: slugify(heading), heading, paragraphs: [] };
    } else if (block.trim()) {
      current.paragraphs.push(block);
    }
  }
  if (current.heading || current.paragraphs.length > 0) sections.push(current);
  return sections;
}

/** Renders `**bold**` inline segments within a paragraph as <strong>. */
function InlineFormatted({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, j) =>
        j % 2 === 1 ? (
          <strong key={j} className="text-ink font-semibold">
            {part}
          </strong>
        ) : (
          <span key={j}>{part}</span>
        ),
      )}
    </>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category, post.slug, 3);
  const sections = post.body ? parseArticleBody(post.body) : [];
  const toc = sections.filter((s) => s.heading);
  // Only surface an "updated" note when the gap is meaningful (not the
  // few-millisecond gap between insert and the row's own default timestamps).
  const wasUpdated = post.updatedAt.getTime() - post.publishedAt.getTime() > 1000 * 60 * 60 * 24;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: post.imageUrl ? [post.imageUrl] : undefined,
          datePublished: post.publishedAt.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          author: { "@type": "Organization", name: post.author },
          publisher: {
            "@type": "Organization",
            name: siteConfig.name,
            logo: { "@type": "ImageObject", url: absoluteUrl("/favicon.svg") },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/blog/${post.slug}`) },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
            { "@type": "ListItem", position: 3, name: post.title, item: absoluteUrl(`/blog/${post.slug}`) },
          ],
        }}
      />
      <SiteHeader />

      {/* Sticky sub-header: appears once the page scrolls past the header,
          giving readers the category + title + a quick way to share while
          deep in a long guide. */}
      <div className="sticky top-0 z-10 border-b border-border-mauve bg-gradient-to-r from-pink-200/70 via-lilac/55 to-mauve-100/70 backdrop-blur">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-2.5 flex items-center gap-5">
          <span className="text-[11px] font-semibold tracking-wide uppercase text-purple-deep shrink-0">
            {post.category}
          </span>
          <span className="text-[13px] text-purple-deep/70 truncate">{post.title}</span>
          <div className="ml-auto">
            <ShareButton title={post.title} />
          </div>
        </div>
      </div>

      <main className="bg-cream text-purple-deep">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <nav aria-label="Breadcrumb" className="text-xs text-tan pt-6 mb-6">
            <Link href="/" className="hover:text-rose">
              Home
            </Link>{" "}
            /{" "}
            <Link href="/blog" className="hover:text-rose">
              Blog
            </Link>{" "}
            / <span className="text-tan-dark">{post.title}</span>
          </nav>

          <div className="max-w-[700px] flex flex-col gap-4 pb-6">
            <span className="text-xs font-semibold tracking-wide uppercase text-rose">
              {post.category}
              {post.topicLabel ? ` · ${post.topicLabel}` : ""}
            </span>
            <h1 className="font-heading text-[34px] md:text-[52px] leading-[1.08] tracking-tight text-ink font-bold">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-[13.5px] text-tan-dark">
              <span className="w-8 h-8 rounded-full bg-mauve-100 border border-border-mauve shrink-0" aria-hidden="true" />
              <span className="text-purple-deep font-medium">By {post.author}</span>
              <span>·</span>
              <span>{wasUpdated ? `Updated ${formatDate(post.updatedAt)}` : formatDate(post.publishedAt)}</span>
            </div>
          </div>

          <figure className="mb-9 flex flex-col gap-2">
            <ImageSlot label={post.imageLabel} imageUrl={post.imageUrl} className="w-full h-[280px] md:h-[440px]" shape="rounded" radius={4} tone="mauve" />
            <figcaption className="text-xs text-tan">{post.imageLabel}</figcaption>
          </figure>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-12 pb-16">
            {/* Main column */}
            <div className="min-w-0 flex flex-col gap-7">
              {wasUpdated && (
                <div className="border border-border border-l-[3px] border-l-pink-200 bg-gradient-to-r from-pink-100/40 to-cream px-4.5 py-3.5 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-rose">
                    Updated {formatDate(post.updatedAt)}
                  </span>
                  <span className="text-sm text-purple-deep/80">
                    We keep this guide current — this article was reviewed and refreshed after it first published.
                  </span>
                </div>
              )}

              {sections.length > 0 ? (
                sections.map((section, i) => (
                  <div key={section.id || i} id={section.id || undefined} className="flex flex-col gap-4 scroll-mt-24">
                    {section.heading && (
                      <h2 className="font-heading text-[26px] leading-tight text-ink font-bold mt-2">{section.heading}</h2>
                    )}
                    {section.paragraphs.map((para, j) => (
                      <p key={j} className="text-[16px] leading-relaxed text-tan-dark">
                        <InlineFormatted text={para} />
                      </p>
                    ))}
                  </div>
                ))
              ) : (
                <p className="text-[16px] leading-relaxed text-tan-dark">{post.excerpt}</p>
              )}

              <div className="flex items-center gap-4 border-t-2 border-purple-deep pt-6 mt-4">
                <span className="w-14 h-14 rounded-full bg-mauve-100 border border-border-mauve shrink-0" aria-hidden="true" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-tan">Written by</span>
                  <span className="font-heading text-lg text-ink font-semibold">{post.author}</span>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
              {toc.length > 0 && (
                <div className="border-t-2 border-purple-deep pt-3 flex flex-col gap-2.5">
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-tan">In this guide</span>
                  {toc.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="text-[13.5px] text-purple-deep border-b border-border pb-2 hover:text-rose"
                    >
                      {section.heading}
                    </a>
                  ))}
                </div>
              )}

              <div className="bg-gradient-to-br from-pink-100 via-lilac/40 to-mauve-100 p-4.5 flex flex-col gap-2 rounded-lg">
                <span className="font-heading text-lg text-ink font-semibold">Get our best picks</span>
                <span className="text-[13px] leading-relaxed text-purple-deep/80">
                  Honest reviews and the best deals we&apos;ve found — straight to your inbox.
                </span>
                <Link
                  href="/#subscribe"
                  className="mt-1 text-center bg-purple-deep text-white rounded-full py-2.5 text-sm font-semibold"
                >
                  Subscribe
                </Link>
              </div>
            </aside>
          </div>
        </div>

        {related.length > 0 && (
          <section className="border-t border-border">
            <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-12">
              <h2 className="font-heading text-xl text-ink font-semibold mb-5">Related Reading</h2>
              <div className="grid sm:grid-cols-3 gap-6">
                {related.map((r) => (
                  <Link key={r.id} href={`/blog/${r.slug}`} className="text-purple-deep card-hover">
                    <ImageSlot label={r.imageLabel} imageUrl={r.imageUrl} className="w-full h-[140px] mb-2.5" shape="rounded" radius={4} tone="pink" />
                    <div className="text-[13.5px] font-semibold leading-snug">{r.title}</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
