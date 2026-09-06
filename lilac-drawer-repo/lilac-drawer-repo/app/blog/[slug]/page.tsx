import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import JsonLd from "@/components/JsonLd";
import ShareButton from "./ShareButton";
import TableOfContents from "./TableOfContents";
import { slugify } from "@/lib/slugify";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts, formatDate } from "@/db/queries";
import type {
  ArticleStructuredContent,
  ArticleFeaturedProduct,
  ArticleCustomSection,
} from "@/db/schema";

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
 * Splits the plain-text body into sections for legacy articles.
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
        )
      )}
    </>
  );
}

/**
 * Parses a paragraph of text, replacing matched keywords with interactive affiliate/internal links
 * and parsing bold text.
 */
function parseTextWithKeywords(
  text: string,
  mappings: { keyword: string; url: string }[]
): React.ReactNode[] {
  if (!mappings || mappings.length === 0 || !text) {
    return [<InlineFormatted key="0" text={text} />];
  }

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const validMappings = mappings.filter((m) => m.keyword && m.keyword.trim().length > 0);
  if (validMappings.length === 0) {
    return [<InlineFormatted key="0" text={text} />];
  }

  const regexPattern = new RegExp(
    `(${validMappings.map((m) => escapeRegex(m.keyword.trim())).join("|")})`,
    "gi"
  );

  const parts = text.split(regexPattern);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    const matchedMapping = validMappings.find(
      (m) => m.keyword.trim().toLowerCase() === part.toLowerCase()
    );

    if (matchedMapping && matchedMapping.url) {
      const isExternal = matchedMapping.url.startsWith("http");
      elements.push(
        <a
          key={`kw-${i}`}
          href={matchedMapping.url}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer sponsored" : undefined}
          className="text-purple-deep underline decoration-lilac underline-offset-4 font-semibold hover:text-rose transition-colors inline-flex items-center gap-0.5 group"
        >
          <span>{part}</span>
          {isExternal && (
            <span
              className="text-[10px] text-tan-dark group-hover:text-rose font-normal select-none"
              aria-hidden="true"
            >
              ↗
            </span>
          )}
        </a>
      );
    } else {
      elements.push(<InlineFormatted key={`txt-${i}`} text={part} />);
    }
  }

  return elements;
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

  // Parse structured review content
  const structured = (post.structuredContent as ArticleStructuredContent | null) ?? null;
  const productsList: ArticleFeaturedProduct[] = structured?.recommendedProducts ?? [];
  const customSections: ArticleCustomSection[] = structured?.customSections ?? [];
  const keywordLinks = structured?.keywordLinks ?? [];

  const hasStructuredContent = productsList.length > 0 || customSections.length > 0;

  // Build keyword link dictionary
  const keywordMappings: { keyword: string; url: string }[] = [];
  if (keywordLinks.length > 0) {
    for (const kl of keywordLinks) {
      if (kl.keyword?.trim() && kl.url?.trim()) {
        keywordMappings.push({ keyword: kl.keyword.trim(), url: kl.url.trim() });
      }
    }
  }
  for (const p of productsList) {
    if (p.name?.trim()) {
      const firstStoreUrl = p.stores?.[0]?.url;
      const targetUrl = firstStoreUrl || `#prod-${slugify(p.name)}`;
      if (!keywordMappings.some((m) => m.keyword.toLowerCase() === p.name.trim().toLowerCase())) {
        keywordMappings.push({ keyword: p.name.trim(), url: targetUrl });
      }
    }
  }
  keywordMappings.sort((a, b) => b.keyword.length - a.keyword.length);

  // Table of Contents entries
  const tocEntries: { id: string; label: string }[] = [];
  if (hasStructuredContent) {
    if (productsList.length > 0) {
      tocEntries.push({ id: "everything-we-recommend", label: "Everything We Recommend" });
      for (const p of productsList) {
        tocEntries.push({ id: `prod-${slugify(p.name)}`, label: p.name });
      }
    }
    for (const s of customSections) {
      if (s.title?.trim()) {
        tocEntries.push({ id: `sec-${slugify(s.title)}`, label: s.title });
      }
    }
  } else {
    const legacySections = post.body ? parseArticleBody(post.body) : [];
    for (const s of legacySections) {
      if (s.heading) {
        tocEntries.push({ id: s.id, label: s.heading });
      }
    }
  }

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
      {productsList.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: post.title,
            description: post.excerpt,
            numberOfItems: productsList.length,
            itemListElement: productsList.map((prod, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              name: prod.name,
              item: {
                "@type": "Product",
                name: prod.name,
                description: prod.subtitle || prod.name,
                image: prod.imageUrl ? [prod.imageUrl] : undefined,
                offers:
                  prod.stores && prod.stores.length > 0
                    ? {
                        "@type": "AggregateOffer",
                        priceCurrency: "USD",
                        lowPrice:
                          prod.stores[0]?.price?.replace(/[^0-9.]/g, "") || undefined,
                        offerCount: prod.stores.length,
                        offers: prod.stores.map((s) => ({
                          "@type": "Offer",
                          price: s.price?.replace(/[^0-9.]/g, "") || undefined,
                          priceCurrency: "USD",
                          seller: { "@type": "Organization", name: s.storeName },
                          url: s.url,
                        })),
                      }
                    : undefined,
              },
            })),
          }}
        />
      )}
      <SiteHeader />

      {/* Article sub-header */}
      <div className="border-b border-border bg-mauve-50">
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

          <div className="max-w-[760px] flex flex-col gap-4 pb-6">
            <span className="text-xs font-semibold tracking-wide uppercase text-rose">
              {post.category}
              {post.topicLabel ? ` · ${post.topicLabel}` : ""}
            </span>
            <h1 className="font-heading text-[34px] md:text-[50px] leading-[1.1] tracking-tight text-ink font-bold">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-[13.5px] text-tan-dark">
              <span className="w-8 h-8 rounded-full bg-mauve-100 border border-border-mauve shrink-0" aria-hidden="true" />
              <span className="text-purple-deep font-medium">By {post.author}</span>
              <span>·</span>
              <span>{wasUpdated ? `Updated ${formatDate(post.updatedAt)}` : formatDate(post.publishedAt)}</span>
            </div>
            {post.excerpt && (
              <p className="text-[17px] leading-relaxed text-purple-deep/90 font-serif italic pt-1 border-l-2 border-lilac pl-4">
                {post.excerpt}
              </p>
            )}
          </div>

          <figure className="mb-9 flex flex-col gap-2">
            <ImageSlot
              label={post.imageLabel}
              imageUrl={post.imageUrl}
              className="w-full h-[280px] md:h-[440px]"
              shape="rounded"
              radius={4}
              tone="mauve"
            />
            {post.imageLabel && <figcaption className="text-xs text-tan">{post.imageLabel}</figcaption>}
          </figure>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-12 pb-16">
            {/* Main column */}
            <div className="min-w-0 flex flex-col gap-8">
              {/* Mobile Quick Jump TOC */}
              {tocEntries.length > 0 && (
                <div className="lg:hidden bg-mauve-50/90 border border-border-mauve rounded-2xl p-4 shadow-xs">
                  <TableOfContents entries={tocEntries} />
                </div>
              )}

              {wasUpdated && (
                <div className="border border-border border-l-[3px] border-l-rose bg-white px-4.5 py-3.5 flex flex-col gap-1 rounded-r-lg">
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-rose">
                    Updated {formatDate(post.updatedAt)}
                  </span>
                  <span className="text-sm text-purple-deep/80">
                    We keep this guide current — this article was reviewed and refreshed after it first published.
                  </span>
                </div>
              )}

              {/* DYNAMIC STRUCTURED REVIEW LAYOUT */}
              {hasStructuredContent ? (
                <div className="flex flex-col gap-10">
                  {/* "Everything We Recommend" Comparison Box */}
                  {productsList.length > 0 && (
                    <section
                      id="everything-we-recommend"
                      className="scroll-mt-24 rounded-2xl border border-border bg-white p-5 sm:p-7 shadow-xs"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-6 h-6 text-rose shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                        <h2 className="font-heading text-2xl font-bold text-ink">
                          Everything We Recommend
                        </h2>
                      </div>
                      <p className="text-xs text-tan-dark mb-6">
                        Summary of our top-rated picks with direct store buying links.
                      </p>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {productsList.map((prod, idx) => (
                          <div
                            key={prod.id || idx}
                            className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3 shadow-xs hover:border-lilac transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              {prod.subtitle ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-pink-100 text-rose px-2.5 py-0.5 rounded-full">
                                  {prod.subtitle}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-mauve-100 text-purple-deep px-2 py-0.5 rounded-full">
                                  Pick #{idx + 1}
                                </span>
                              )}
                              <a
                                href={`#prod-${slugify(prod.name)}`}
                                className="text-[11px] font-medium text-lilac hover:text-rose transition-colors"
                              >
                                Read review ↓
                              </a>
                            </div>

                            {prod.imageUrl && (
                              <div className="w-full h-36 relative rounded-lg overflow-hidden bg-neutral-100 border border-border-mauve/40">
                                <ImageSlot
                                  label={prod.imageLabel || prod.name}
                                  imageUrl={prod.imageUrl}
                                  className="w-full h-full object-cover"
                                  shape="rounded"
                                  radius={0}
                                  tone="pink"
                                />
                              </div>
                            )}

                            <div>
                              <a
                                href={`#prod-${slugify(prod.name)}`}
                                className="font-heading text-base font-bold text-ink hover:text-rose transition-colors line-clamp-2"
                              >
                                {prod.name}
                              </a>
                            </div>

                            {/* Store price buttons */}
                            {prod.stores && prod.stores.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-border/60">
                                {prod.stores.map((st, sIdx) => (
                                  <a
                                    key={st.id || sIdx}
                                    href={st.url}
                                    target="_blank"
                                    rel="noopener noreferrer sponsored"
                                    className="text-xs bg-purple-deep hover:bg-lilac text-white px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 shadow-xs"
                                  >
                                    <span>{st.storeName}</span>
                                    {st.price && (
                                      <span className="text-pink-200 font-bold">{st.price}</span>
                                    )}
                                    <span className="text-[10px] opacity-70">↗</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Product Deep-Dive Reviews */}
                  {productsList.map((prod, idx) => (
                    <article
                      key={prod.id || idx}
                      id={`prod-${slugify(prod.name)}`}
                      className="scroll-mt-24 border-t border-border pt-9 first:border-t-0 first:pt-0 flex flex-col gap-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-deep text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {prod.subtitle && (
                          <span className="text-xs font-bold uppercase tracking-wider bg-pink-100 text-rose px-3 py-1 rounded-full">
                            {prod.subtitle}
                          </span>
                        )}
                      </div>

                      <h2 className="font-heading text-2xl md:text-3xl font-bold text-ink leading-snug">
                        {prod.name}
                      </h2>

                      {/* Large Product Photo */}
                      {prod.imageUrl && (
                        <figure className="my-2 flex flex-col gap-2">
                          <ImageSlot
                            label={prod.imageLabel || prod.name}
                            imageUrl={prod.imageUrl}
                            className="w-full h-[300px] md:h-[420px]"
                            shape="rounded"
                            radius={6}
                            tone="mauve"
                          />
                          {prod.imageLabel && (
                            <figcaption className="text-xs text-tan italic">
                              {prod.imageLabel}
                            </figcaption>
                          )}
                        </figure>
                      )}

                      {/* Multi-Store Pricing Banner */}
                      {prod.stores && prod.stores.length > 0 && (
                        <div className="my-2 p-4 rounded-xl bg-mauve-50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-tan-dark">
                              Where to Buy & Current Prices
                            </span>
                            <span className="text-xs text-purple-deep/70">
                              Direct affiliate links to authorized retailers
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {prod.stores.map((st, sIdx) => (
                              <a
                                key={st.id || sIdx}
                                href={st.url}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="bg-purple-deep hover:bg-lilac text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02]"
                              >
                                <span>Buy on {st.storeName}</span>
                                {st.price && (
                                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-bold text-pink-100">
                                    {st.price}
                                  </span>
                                )}
                                <span>↗</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Product Summary / Review Paragraphs */}
                      {prod.summary && (
                        <div className="flex flex-col gap-4 text-[16px] leading-relaxed text-tan-dark mt-2">
                          {prod.summary.split(/\n\s*\n/).map((para, pIdx) => (
                            <p key={pIdx}>
                              {parseTextWithKeywords(para, keywordMappings)}
                            </p>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}

                  {/* Dynamic Custom Content Sections */}
                  {customSections.map((sec, sIdx) => (
                    <section
                      key={sec.id || sIdx}
                      id={`sec-${slugify(sec.title)}`}
                      className="scroll-mt-24 border-t border-border pt-9 flex flex-col gap-4"
                    >
                      <h2 className="font-heading text-2xl md:text-[28px] font-bold text-ink leading-tight">
                        {sec.title}
                      </h2>

                      {sec.imageUrl && (
                        <figure className="my-2 flex flex-col gap-2">
                          <ImageSlot
                            label={sec.imageLabel || sec.title}
                            imageUrl={sec.imageUrl}
                            className="w-full h-[260px] md:h-[380px]"
                            shape="rounded"
                            radius={4}
                            tone="pink"
                          />
                          {sec.imageLabel && (
                            <figcaption className="text-xs text-tan italic">
                              {sec.imageLabel}
                            </figcaption>
                          )}
                        </figure>
                      )}

                      {sec.content && (
                        <div className="flex flex-col gap-4 text-[16px] leading-relaxed text-tan-dark">
                          {sec.content.split(/\n\s*\n/).map((para, pIdx) => (
                            <p key={pIdx}>
                              {parseTextWithKeywords(para, keywordMappings)}
                            </p>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              ) : (
                /* LEGACY MARKDOWN ARTICLE BODY FALLBACK */
                <div className="flex flex-col gap-7">
                  {post.body ? (
                    parseArticleBody(post.body).map((section, i) => (
                      <div
                        key={section.id || i}
                        id={section.id || undefined}
                        className="flex flex-col gap-4 scroll-mt-24"
                      >
                        {section.heading && (
                          <h2 className="font-heading text-[26px] leading-tight text-ink font-bold mt-2">
                            {section.heading}
                          </h2>
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
                </div>
              )}

              {/* Author Footer Card */}
              <div className="flex items-center gap-4 border-t-2 border-purple-deep pt-6 mt-4">
                <span
                  className="w-14 h-14 rounded-full bg-mauve-100 border border-border-mauve shrink-0"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-tan">
                    Written by
                  </span>
                  <span className="font-heading text-lg text-ink font-semibold">
                    {post.author}
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Table of Contents & Newsletter */}
            <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
              {tocEntries.length > 0 && <TableOfContents entries={tocEntries} />}

              <div className="bg-white border border-border shadow-xs p-5 flex flex-col gap-2.5 rounded-2xl">
                <span className="font-heading text-lg text-ink font-semibold">
                  Get our best picks
                </span>
                <span className="text-[13px] leading-relaxed text-purple-deep/80">
                  Honest reviews and the best deals we&apos;ve found — straight to your inbox.
                </span>
                <Link
                  href="/#subscribe"
                  className="mt-1 text-center bg-purple-deep text-white rounded-full py-2.5 text-sm font-semibold hover:bg-lilac transition-colors"
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
                  <Link
                    key={r.id}
                    href={`/blog/${r.slug}`}
                    className="text-purple-deep card-hover"
                  >
                    <ImageSlot
                      label={r.imageLabel}
                      imageUrl={r.imageUrl}
                      className="w-full h-[140px] mb-2.5"
                      shape="rounded"
                      radius={4}
                      tone="pink"
                    />
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
