# Lilac Drawer

Next.js 16 / React 19 / Tailwind CSS v4 site for "Lilac Drawer" — an affiliate
reviews & buying-guides magazine (clothing care, accessories, wardrobe
storage, jewelry) — with SEO built in from the ground up, backed by a real
Postgres database via Drizzle ORM.

## Database setup (required)

The site reads all product/post/community content from Postgres via Drizzle.
Nothing renders without a working `DATABASE_URL`.

### 1. Get a Postgres database

- **Local development**: install Postgres and create a database, or use any
  hosted free-tier Postgres.
- **Production (Vercel)**: open your Vercel project → **Storage** tab →
  **Create Database** → **Postgres** (this provisions a Neon-backed
  database and wires the connection string in automatically as
  `DATABASE_URL`) — no manual copy/paste needed. Alternatively, create a free
  database directly at [neon.tech](https://neon.tech) and add its connection
  string as an Environment Variable named `DATABASE_URL` in your Vercel
  project settings.

### 2. Configure the connection string

```bash
cp .env.example .env.local
# then edit .env.local and paste your real DATABASE_URL
```

### 3. Create the schema — and, optionally, demo data

```bash
npm install
npm run db:generate   # generates SQL migration files from db/schema.ts
npm run db:migrate    # applies them to DATABASE_URL — required, every time
npm run db:seed       # OPTIONAL — see below
```

`npm run db:migrate` is required: it creates the tables. `npm run db:seed`
is **optional demo/placeholder content** (sample products, articles, and a
few fake community accounts/posts) meant only for previewing the design
locally — skip it for a real launch. It's idempotent (clears and
re-inserts the same demo rows), so it's also safe to run and later undo:

```bash
npm run db:seed        # adds demo content
npm run db:seed:clear  # removes it again — 0 products, 0 posts, 0 demo users
```

A freshly migrated (unseeded) database is a fully valid state — every page
on the site (`/`, `/blog`, `/deals`, `/explore`, `/community`, etc.)
renders correctly with zero rows, just showing empty sections instead of
placeholder cards. Add real products and articles from the **Lilac Drawer
Admin** dashboard (see below) once you're ready to go live.

### 4. Set up authentication (required for the Community)

The Community section (`/community`) needs real accounts — posting,
commenting, liking, and reposting all require signing in. Add these two
variables to `.env.local` (and to Vercel's Environment Variables for
production):

```bash
BETTER_AUTH_SECRET="paste output of: openssl rand -base64 32"
BETTER_AUTH_URL="http://localhost:3000"   # your real domain in production
```

Auth is powered by [Better Auth](https://better-auth.com) with email +
password sign-in — no OAuth app/API keys needed to get started. The `user`,
`session`, `account`, and `verification` tables are already included in the
schema/migrations above.

### 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Editing content

There is no admin UI in this project — content (products, articles, and
their photos) is managed exclusively from the separate **Lilac Drawer
Admin** dashboard (a different app, `lilac-drawer-admin/`, connecting to
this same database — see its own README for setup and its photo-upload
feature). Until it's running, or for one-off edits:

- **Quick edits**: use `npm run db:studio` to open Drizzle Studio, a visual
  database browser/editor in your browser.
- **Schema changes**: edit `db/schema.ts` (and its exact copy in
  `lilac-drawer-admin/db/schema.ts` — see the note at the top of the file),
  then run `npm run db:generate` followed by `npm run db:migrate`.
- **Demo/placeholder content** (for previewing the design, not real
  content): `db/seed.ts` — `npm run db:seed` adds it, `npm run
  db:seed:clear` removes it again. Real products and articles belong in
  the admin dashboard, not in this file.

### Draft/publish and manual ordering (used by the admin dashboard)

`posts` has two columns the admin dashboard writes to, that this app's own
queries already respect:

- **`isPublished`** (default `true`) — a post with this set to `false` is a
  draft: excluded from every public listing, its own `/blog/[slug]` page,
  and the sitemap.
- **`sortOrder`** (default `0`, lower = shown first) — the manual order set
  from the dashboard; listings sort by this first, then by `publishedAt`.

### How site traffic is measured

A small client component (`components/VisitTracker.tsx`) pings
`/api/track-visit` on first load and every client-side navigation, logging a
row to the `page_views` table. This is intentionally minimal — no cookies,
no IP/user-agent storage — just a per-request path + timestamp. The admin
dashboard reads this table to show total visits and a traffic chart.

## Production build

```bash
npm run build
npm run start
```

Pages use **ISR** (`revalidate = 60`): they're statically cached for
performance but automatically re-fetch from the database every 60 seconds,
so content changes (new deals, updated prices, new posts) show up without
a redeploy.

## Before going live

1. **Domain**: set the real production domain in `lib/site.ts` (`siteConfig.url`).
   The sitemap, robots.txt, canonical URLs and OG tags all derive from it.
2. **Database**: provision the production Postgres database and set
   `DATABASE_URL` in Vercel's Environment Variables (see above), then run
   `npm run db:migrate` once against it. Don't run `db:seed` — that's demo
   content only; add real products/articles from the admin dashboard.
3. **Images**: `components/ImageSlot.tsx` already renders a real
   `next/image` for any row with an `imageUrl` set, falling back to the
   styled placeholder otherwise — no code change needed per-photo. Upload
   real photos from the admin dashboard's Articles/Products forms (it
   stores them in Vercel Blob and fills in `imageUrl` automatically); real
   photos are what actually earn image-search traffic.
4. **Analytics / Search Console**: add your GA4 / Search Console verification
   once you have the real domain.

## Database schema

11 tables in `db/schema.ts` (4 of them — `user`, `session`, `account`,
`verification` — are auto-generated by Better Auth in `db/auth-schema.ts`
and re-exported from `db/schema.ts`), all queried through `db/queries.ts`
(never import from a table directly in a page):

- **`products`** — the entire product/deal catalog. Every "list of products"
  section across the site (home picks, deals page grids, explore cards,
  saved picks, etc.) is a filtered query against this one table via boolean
  placement flags (`isFeaturedHome`, `isTodayDeal`, `isExploreDeal`, …)
  instead of a separate hardcoded array per section.
- **`posts`** — reviews, care guides, buying guides, and stories, each with
  its own `/blog/[slug]` page. `category` (REVIEWS/CARE/GUIDES/STORIES) is
  the canonical value used for blog-page filtering and JSON-LD; `topicLabel`
  is an optional secondary display label (e.g. "Wardrobe") used only where
  the same article is teased in a different context, like the home "Latest
  Reviews" strip — this avoids needing a duplicate row (and a duplicate
  URL) per display context. `body` holds the full article content rendered
  on the article page (blank-line-separated paragraphs; `**text**` renders
  as bold). Boolean placement flags (`isNewHome`, `isRecentBlog`,
  `isSideStory`, …) control which page sections pull each post in.
- **`site_categories`** — sidebar category chips and Explore's category tiles.
- **`user`** — real accounts (Better Auth). `handle` and `bio` are custom
  fields added on top of Better Auth's defaults; `handle` is the public
  `@username` used in URLs (`/community/[handle]`).
- **`community_posts`** — real, user-authored posts (Twitter/Reddit-style).
  A repost-with-opinion is just another row here: `repostOfId` points at the
  original post and `body` holds the reposter's own commentary. A
  "share a product" post sets `productId`. `commentCount` / `repostCount` /
  `likeCount` are counters kept in sync by the actions in
  `lib/community-actions.ts` — never written to directly from a page.
- **`comments`** — comments on a community post.
- **`likes`** — one row per (post, user); the unique constraint is what
  makes the like/unlike toggle safe (see below).
- **`trends`** — trending tags shown in the Community sidebar.

## How the like/repost toggle avoids double-counting

`lib/community-actions.ts` runs each toggle as a single database
transaction: check whether a row already exists for (this post, this user)
→ if yes, delete it and decrement the counter; if no, insert it and
increment the counter. Because the check and the write happen in one
transaction against the `likes` table's unique `(postId, userId)` index,
clicking the same button twice always reverses the previous action instead
of adding a second count — pressing Like never goes above +1 for a given
person, and pressing it again always returns to exactly the original
count, not further below it. The Like/Repost buttons also disable
themselves while a request is in flight to prevent a rapid double-click
firing two toggles before the first one resolves.

## What's indexed vs not

- `/`, `/blog`, `/blog/[slug]` (every article), `/deals`,
  `/community/post/[id]` (every post), `/community/[handle]` (every user's
  profile) — full SEO: metadata, Open Graph, JSON-LD, included in
  `sitemap.xml`, which is generated dynamically from the database so new
  articles, posts, and profiles are added automatically without a code
  change — this is what makes user-generated community content
  discoverable in search, the way a post or comment on Reddit or Twitter
  is.
- `/explore`, `/community` (the live feed itself), `/profile`,
  `/fashion-collage`, `/login`, `/signup` — these are either
  personalized/app-style screens with no unique static content of their
  own (the feed just re-lists posts that already have their own indexable
  URL) or account-management pages, so they're marked `noindex` and
  excluded from the sitemap to avoid thin/duplicate-content signals. They
  are linked from the main header/footer navigation so visitors can still
  reach them directly.

## SEO features implemented

- **Individual article pages** (`/blog/[slug]`) — every post has its own
  indexable, statically-generated URL with full metadata, a unique
  per-article Open Graph image, and `BlogPosting` + `BreadcrumbList`
  JSON-LD. This is the single highest-impact SEO piece: previously every
  "read more" link on the blog listing pointed nowhere real.
- **No duplicate content** — the database schema uses one canonical row
  per article (with placement flags controlling which page sections surface
  it) instead of copy-pasting the same review into multiple arrays, which
  would otherwise create several near-identical pages competing with each
  other for ranking.
- **Real internal linking** — every card, teaser, and "read more" link
  across Home, Blog, and Deals now points to the specific article it
  represents rather than a generic `/blog` link or a dead `href="#"`.
- Per-page `metadata` (title, description, canonical) via a shared
  `buildMetadata()` helper so Open Graph / Twitter tags stay complete and
  consistent on every route
- Open Graph + Twitter Card tags, including a dynamically generated
  1200×630 OG image per page (`app/opengraph-image.tsx` site-wide,
  `app/blog/[slug]/opengraph-image.tsx` per article)
- JSON-LD: Organization, WebSite (with SearchAction), Blog, BreadcrumbList,
  Product/ItemList on the deals page, and BlogPosting on every article
- `app/sitemap.ts` and `app/robots.ts` (auto-generated from the database,
  no static XML to maintain by hand)
- Single `<h1>` per page (a duplicate-heading issue on the blog listing was
  fixed as part of this pass)
- Semantic HTML (header/nav/main/article/section/footer), descriptive
  `alt` text on every image slot, accessible form labels
- Self-hosted fonts via `@fontsource` (no third-party request to Google
  Fonts at runtime — faster LCP, one less render-blocking origin)
- ISR-cached output (`○ Static` / `● SSG` + 60s revalidate) — pages are
  served from cache like a static site, but stay current with the database

## Security

- **Security headers** (`next.config.ts`) on every response: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY` (no framing/clickjacking), `Referrer-Policy: strict-origin-when-cross-origin`,
  a locked-down `Permissions-Policy`, and HSTS. `X-Powered-By` is disabled
  so the framework/version isn't advertised for free.
- **Auth**: Better Auth with rate limiting explicitly enabled (brute-force
  protection on `/sign-in/email` etc., not just relying on the
  production-only default), 30-day sessions, and passwords never touch the
  database in plaintext (Better Auth's built-in hashing).
- **Server Actions** (`lib/community-actions.ts`) all re-derive the acting
  user from the session server-side (`requireUserId()`) — never trust a
  user ID passed in from the client.
- **`role` isn't client-settable** — it's excluded from Better Auth's
  client-writable fields (`input: false`), so it can only ever be changed
  by a server-side action, never via a signup/profile-update request.
- **`/api/track-visit`** is necessarily unauthenticated (every visitor hits
  it), so it includes a same-origin check as a lightweight deterrent
  against external spam — page-view counts are approximate by design,
  nothing security-sensitive depends on this table.
- **Secrets**: `.env*` is gitignored (`.env.example` is the only tracked
  one) — `DATABASE_URL` and `BETTER_AUTH_SECRET` never reach version control.
