# Lilac Drawer Admin

A separate, standalone Next.js app — its own project, its own deployment,
its own port — that runs the Lilac Drawer site day-to-day. It's not part of
the public site's codebase; it connects to the **same Postgres database**
via Drizzle and shares the same `user` table (and Better Auth backend), so
any account created on the public site can be granted admin access here.

## Pages

- **Overview** (`/`) — user count, article count (published vs. draft),
  product count, and total site visits with a 14-day traffic chart.
- **Users** (`/users`) — every registered account (shared with the public
  site's `/signup`), with a button to grant/revoke admin access.
- **Articles** (`/articles`) — write, edit, publish/unpublish, delete, and
  manually reorder blog posts (▲/▼ sets `sortOrder`, which the public
  site's blog listing sorts by). A post saved with "Publish" unchecked is a
  draft — invisible on the public site until published.
- **Products & Affiliate Links** (`/products`) — add/edit/delete products,
  including the affiliate/tracked link and which sections of the public
  site each product appears in.

## Setup

This app requires the **main Lilac Drawer site's database migrations to
already be applied** — it reads/writes `posts.is_published`,
`posts.sort_order`, `user.role`, and the `page_views` table, all added by
that project's `db/migrations/0003_green_gargoyle.sql`. Run
`npm run db:migrate` in the main site first if you haven't already.

```bash
npm install
cp .env.example .env.local
# edit .env.local:
#  - DATABASE_URL: same connection string as the main site
#  - BETTER_AUTH_SECRET: same value as the main site's .env.local
#  - BETTER_AUTH_URL: this app's own URL (defaults fine for local dev)
npm run dev
```

Open **http://localhost:3001** (this app defaults to port 3001 so it can
run alongside the main site on 3000).

### Bootstrap your first admin account

Sign up normally on the **main site** at `/signup`, then promote that
account to admin (there's no UI path to create the *first* admin, since
granting access itself requires already being one) — run this from the
**main site's** directory, against the same `DATABASE_URL`:

```bash
npm run db:make-admin -- you@example.com
```

(Or, if you'd rather do it visually: `npm run db:studio` from the main
site, open the `user` table, find your account, set `role` to `admin`.)
Then sign in here at `/login` with the same email/password.

## How content changes reach the public site

This app writes directly to the same database — nothing is duplicated or
synced. The public site uses ISR (`revalidate = 60`), so anything you
publish, edit, or reorder here shows up there within about 60 seconds,
automatically — no redeploy, no manual step.

## Traffic data

Visit counts come from the `page_views` table, which the **public site**
(not this app) writes to via `components/VisitTracker.tsx` on every page
view. This app only reads and aggregates it for the Overview chart.

## Production

```bash
npm run build
npm run start
```

Deploy it as its own project (its own Vercel project, its own domain like
`admin.lilacdrawer.com`) — keep it off any public DNS you don't want
indexed; every page here already sets `robots: noindex`.
