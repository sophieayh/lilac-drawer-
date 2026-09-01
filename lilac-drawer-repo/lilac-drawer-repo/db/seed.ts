import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";
import { products, posts, siteCategories, communityPosts, trends, user, comments, likes } from "./schema";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — add it to .env.local");

const db = drizzle(new Pool({ connectionString }), { schema });

function money(dollarString: string): number {
  const n = Number(dollarString.replace(/[^0-9.]/g, ""));
  return Math.round(n * 100);
}

async function main() {
  console.log("Seeding…");

  // Clear existing rows (idempotent re-seed for dev).
  await db.delete(communityPosts);
  await db.delete(posts);
  await db.delete(products);
  await db.delete(siteCategories);
  await db.delete(trends);

  // ---------------- products ----------------
  await db.insert(products).values([
    // Home "Today's Picks"
    { slug: "rowenta-access-steam-handheld", name: "Rowenta Access Steam Handheld", category: "Clothing Care", imageLabel: "Rowenta handheld steamer", priceCents: money("$44"), compareAtPriceCents: money("$60"), isFeaturedHome: true },
    { slug: "cedar-wood-sweater-blocks-6pk", name: "Cedar Wood Sweater Blocks (6-pack)", category: "Wardrobe Storage", imageLabel: "Cedar wood sweater blocks", priceCents: money("$14"), compareAtPriceCents: money("$19"), isFeaturedHome: true },
    { slug: "anti-tarnish-jewelry-box", name: "Anti-Tarnish Jewelry Box", category: "Jewelry & Watches", imageLabel: "Anti-tarnish jewelry box", priceCents: money("$32"), compareAtPriceCents: money("$45"), isFeaturedHome: true, isSaved: true },

    // Home Top 10 / top picks
    { slug: "steamfast-sf717", name: "Steamfast SF-717 Fabric Steamer", category: "Clothing Care", imageLabel: "Steamfast SF-717 steamer", priceCents: money("$44"), rank: 1, rankNote: "Fastest heat-up, best for daily use", isTopPick: true, isSaleOff: true, compareAtPriceCents: money("$60"), isFeaturedDeals: true, isBestSeller: true, isSaved: true },
    { slug: "conair-turbo-extremesteam", name: "Conair Turbo ExtremeSteam", category: "Clothing Care", imageLabel: "Conair Turbo ExtremeSteam", priceCents: money("$52"), rank: 2, rankNote: "Largest water tank in the test", isTopPick: true },
    { slug: "pursteam-worlds-best-steamer", name: "PurSteam World's Best Steamer", category: "Clothing Care", imageLabel: "PurSteam fabric steamer", priceCents: money("$39"), rank: 3, rankNote: "Quietest, good for shared spaces", isTopPick: true },
    { slug: "rowenta-access-steam", name: "Rowenta Access Steam", category: "Clothing Care", imageLabel: "Rowenta Access Steam", priceCents: money("$60"), rank: 4, rankNote: "Most compact, travels well", isTopPick: true },

    // Deals page catalog
    { slug: "garment-steamer-pro", name: "Garment Steamer Pro", category: "Steamers", imageLabel: "Garment steamer", priceCents: money("$44.00"), compareAtPriceCents: money("$60.00"), isFeaturedDeals: true, isTodayDeal: true, isExploreDeal: true, discountPercent: 25, subtitle: "Editor's Choice" },
    { slug: "fabric-shaver", name: "Fabric Shaver", category: "Cleaning Tools", imageLabel: "Fabric shaver", priceCents: money("$25.00"), isFeaturedDeals: true, isNewArrival: true },
    { slug: "silk-scarf-blush", name: "Silk Scarf, Blush", category: "Accessories", imageLabel: "Silk scarf", priceCents: money("$29.00"), compareAtPriceCents: money("$38.00"), isFeaturedDeals: true, isTodayDeal: true, isExploreDeal: true, discountPercent: 24, subtitle: "Reader Favorite" },
    { slug: "jewelry-box", name: "Jewelry Box", category: "Jewelry & Watches", imageLabel: "Jewelry box", priceCents: money("$32.00"), compareAtPriceCents: money("$45.00"), isFeaturedDeals: true, isTodayDeal: true, isExploreDeal: true, discountPercent: 29, subtitle: "Best for Rings" },
    { slug: "cedar-blocks-6", name: "Cedar Blocks (6)", category: "Wardrobe Storage", imageLabel: "Cedar blocks", priceCents: money("$14.00"), compareAtPriceCents: money("$19.00"), isFeaturedDeals: true, isTodayDeal: true, isExploreDeal: true, discountPercent: 26, subtitle: "Set of 6" },
    { slug: "wool-dryer-balls", name: "Wool Dryer Balls", category: "Clothing Care", imageLabel: "Wool dryer balls", priceCents: money("$16.00"), isFeaturedDeals: true, isNewArrival: true, isSuggested: true },

    { slug: "shoulder-bag", name: "Shoulder Bag", category: "Bags", imageLabel: "Shoulder bag", priceCents: money("$39.99"), compareAtPriceCents: money("$49.99"), isSaleOff: true, isBestSeller: true, isSaved: true, subtitle: "Olive Green" },
    { slug: "cleaning-cloth", name: "Cleaning Cloth", category: "Cleaning Tools", imageLabel: "Cleaning cloth", priceCents: money("$9.50"), compareAtPriceCents: money("$12.00"), isSaleOff: true },

    { slug: "wireless-fabric-shaver", name: "Wireless Fabric Shaver", category: "Cleaning Tools", imageLabel: "Fabric shaver", priceCents: money("$25.00"), isNewArrival: true },
    { slug: "silk-pillowcase", name: "Silk Pillowcase", category: "Accessories", imageLabel: "Silk pillowcase", priceCents: money("$28.00"), isNewArrival: true, isSaved: true, subtitle: "Champagne" },

    { slug: "jewelry-cleaning-cloth", name: "Jewelry Cleaning Cloth", category: "Jewelry & Watches", imageLabel: "Jewelry cleaning cloth", priceCents: money("$9.50"), isBestSeller: true, isSuggested: true },

    // Explore-only recommended items
    { slug: "oversized-cotton-shirt", name: "Oversized Cotton Shirt", category: "Clothing Care", imageLabel: "Cotton shirt", priceCents: money("$29.99"), isRecommended: true, subtitle: "Beige" },
    { slug: "minimalist-shoulder-bag", name: "Minimalist Shoulder Bag", category: "Bags", imageLabel: "Shoulder bag", priceCents: money("$39.99"), isRecommended: true, isSaved: true, subtitle: "Olive Green" },
    { slug: "the-ordinary-niacinamide", name: "The Ordinary Niacinamide", category: "Accessories", imageLabel: "Niacinamide serum", priceCents: money("$6.75"), isRecommended: true, subtitle: "10% + Zinc 30ml" },
    { slug: "lint-roller-refill-pack", name: "Lint Roller Refill Pack", category: "Clothing Care", imageLabel: "Lint roller refills", priceCents: money("$15.20"), isRecommended: true, subtitle: "3-Pack" },
    { slug: "cedar-wood-blocks-set", name: "Cedar Wood Blocks", category: "Wardrobe Storage", imageLabel: "Cedar wood blocks", priceCents: money("$14.00"), isSaved: true, subtitle: "Set of 6" },
  ]);

  // ---------------- posts ----------------
  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 86400000);

  await db.insert(posts).values([
    {
      slug: "lets-talk-about-socks-baby",
      title: "Let's Talk About Socks, Baby",
      excerpt: "Socks, upgraded.",
      category: "STORIES",
      imageLabel: "Socks",
      publishedAt: daysAgo(0),
      isNewHome: true,
      body: `Nobody thinks about socks until theirs have holes in them. We spent a month wearing eleven pairs on rotation to see which ones actually earned a permanent drawer spot.

The winners had two things in common: a reinforced heel knit tighter than the rest of the sock, and a cuff that stayed put through a full day without leaving a red ring. Cheaper pairs looked identical on the rack but sagged by lunchtime.

Fabric blend mattered more than we expected. A small amount of nylon or spandex in the mix — even 3 to 5 percent — made the difference between a sock that lasted eight months and one that lasted two years of regular washing.`,
    },
    {
      slug: "cheap-alternatives-closet-organizers",
      title: "8 Cheap Alternatives to Pricey Closet Organizers",
      excerpt: "Budget-friendly wardrobe storage that actually works.",
      category: "GUIDES",
      imageLabel: "Closet organizers",
      publishedAt: daysAgo(0),
      isNewHome: true,
      body: `Closet systems from big-box retailers can run several hundred dollars before you've hung a single shirt. Most of that cost is the branded hardware, not the storage capacity.

We tested tension rods, over-the-door pocket organizers, stackable fabric bins, and a handful of dollar-store finds against name-brand kits. The tension-rod-plus-bins combination held up best for closets under 6 feet wide, and cost roughly a fifth of the equivalent packaged system.

The one place it's worth spending more: drawer dividers. Cheap plastic ones warp within a season. A basic wood or bamboo set lasts years and actually keeps folded items upright instead of sliding into a pile.`,
    },
    {
      slug: "pick-right-jewelry-cleaner",
      title: "How to Pick the Right Jewelry Cleaner for Your Pieces",
      excerpt: "Match the cleaner to the metal.",
      category: "GUIDES",
      imageLabel: "Jewelry cleaner",
      publishedAt: daysAgo(1),
      isNewHome: true,
      body: `Not every jewelry cleaner is safe for every metal, and using the wrong one can dull a finish permanently. Ammonia-based dips work well on solid gold and diamonds but can pit softer stones like opal, pearl, or emerald.

For silver, a mild dish-soap solution and a soft cloth handle daily tarnish fine — reach for a dedicated silver polish only every few months. Gold-plated pieces should never touch a chemical dip at all; the plating can strip off in seconds.

When in doubt, a microfiber cloth and lukewarm soapy water is the safest default across almost every material, even if it's not the fastest option on the shelf.`,
    },
    {
      slug: "scarf-storage-trick",
      title: "The Scarf Storage Trick That Actually Works",
      excerpt: "No more tangled drawers.",
      category: "CARE",
      imageLabel: "Scarf storage",
      publishedAt: daysAgo(2),
      isNewHome: true,
      body: `Scarves are the one accessory that seems to actively resist organization — fold them flat and they slide into a knotted pile within a week. The fix that finally stuck for us: rolling instead of folding, then storing upright in a shallow drawer like files in a cabinet.

Rolled scarves take up less space, don't develop the same crease lines as folded ones, and — because you can see the top edge of every roll — you can find the one you want without unpacking the whole drawer.

For silk specifically, roll loosely rather than tight. A tight roll left for months can set a crease that's hard to steam out later.`,
    },

    {
      slug: "why-sweaters-keep-pilling",
      title: "Why Your Sweaters Keep Pilling (And How to Stop It)",
      excerpt: "It's the friction, not the fiber quality.",
      category: "CARE",
      imageLabel: "Sweater pilling",
      publishedAt: daysAgo(11),
      isHomePreview: true,
      isDealsPreview: true,
      body: `Pilling gets blamed on cheap yarn, but the real cause is almost always friction — the repeated rubbing of a bag strap, seatbelt, or another garment against the same patch of fabric until loose fibers twist into little balls.

Looser knits and softer fibers like cashmere and merino pill faster because the fibers are shorter and less tightly spun, not because the sweater is poorly made. Even expensive sweaters pill under enough friction.

A fabric shaver run lightly over the surface every few wears keeps pilling from building up, and hand-washing instead of machine-washing cuts new pilling significantly since the agitation is what accelerates it.`,
    },
    {
      slug: "dry-clean-vs-dry-clean-only",
      title: "The Real Difference Between Dry Clean and Dry Clean Only",
      excerpt: "One is a suggestion, the other a rule.",
      category: "CARE",
      imageLabel: "Dry cleaning",
      publishedAt: daysAgo(18),
      isHomePreview: true,
      isDealsPreview: true,
      body: `"Dry Clean" on a care label is a recommendation — the manufacturer is telling you dry cleaning is the safest bet, but hand-washing in cold water often works fine if you're careful. "Dry Clean Only" is different: it's a legal requirement under care-labeling rules, usually because the fabric or trim will genuinely be damaged by water.

The distinction usually comes down to what's holding the garment together. Structured blazers with fusible interfacing, anything with foil print or beading, and most silk with a printed pattern fall into the "Only" category because water can warp the structure or bleed the dye.

When the label just says "Dry Clean" with no "Only," a gentle hand-wash and flat dry has worked for us on most cotton, wool, and unstructured silk pieces.`,
    },
    {
      slug: "storing-jewelry-tangle-tarnish",
      title: "Storing Jewelry So It Doesn't Tangle or Tarnish",
      excerpt: "A five-minute fix for a common drawer problem.",
      category: "CARE",
      imageLabel: "Jewelry storage",
      publishedAt: daysAgo(25),
      isHomePreview: true,
      isDealsPreview: true,
      body: `Chains tangle for a simple reason: they're thrown into a shared space where they can move against each other. Separating each piece — even with something as basic as a small plastic bag per chain — solves most of the problem instantly.

Tarnish is a different fight. Silver and silver-plated pieces react with sulfur in the air, so an airtight container slows it down noticeably compared to an open dish or tray. Anti-tarnish strips (the same ones used in silver flatware chests) work in a jewelry box too.

Rings and earrings are the easiest to lose — a lined tray with individual slots beats a shared bowl every time we've tested it.`,
    },

    {
      slug: "lint-roller-outlasted-three",
      title: "This Lint Roller Outlasted Three Cheaper Ones Combined",
      excerpt: "Sticky sheets that actually hold onto pet hair after a full week of use.",
      category: "REVIEWS",
      topicLabel: "Clothing Care",
      imageLabel: "Lint roller review",
      publishedAt: daysAgo(21),
      isHomeReview: true,
      body: `We went through four lint rollers over six weeks in a two-cat household, tracking how many sheets each roll actually used before the adhesive gave out. The winner lasted noticeably longer per sheet than the cheaper store-brand rollers we tested alongside it.

The difference came down to adhesive strength holding up through multiple passes on the same sheet, rather than needing a fresh sheet after one or two swipes. On heavy pet-hair days that adds up fast.

The handle also matters more than expected — a slightly weighted grip made long sessions on couch cushions and car seats noticeably less tiring on the wrist.`,
    },
    {
      slug: "silk-scarf-doesnt-snag",
      title: "The Silk Scarf That Doesn't Snag or Slip Off",
      excerpt: "Tested against wind, wear, and a full workday of shoulder bags.",
      category: "REVIEWS",
      topicLabel: "Accessories",
      imageLabel: "Silk scarf review",
      publishedAt: daysAgo(18),
      isHomeReview: true,
      body: `Most silk scarves look great for the first hour and then either slide off the shoulder or snag the first time a bag strap crosses them. We wore this one through a full week of commutes, including two genuinely windy days, to see if it held up.

The weave is slightly heavier than typical silk twill, which is exactly why it stayed put — lighter silk moves too easily against wool or cotton coats. It also resisted snagging on a canvas tote strap in a way three cheaper scarves in the same test did not.

Hand-wash in cold water with a mild detergent kept the color from fading after repeated wears, which wasn't true of every scarf we tried this season.`,
    },
    {
      slug: "cedar-block-worth-keeping",
      title: "A Cedar Block Worth Keeping in Every Drawer",
      excerpt: "No sanding required, and the scent lasted longer than the competition.",
      category: "CARE",
      topicLabel: "Wardrobe",
      imageLabel: "Cedar block review",
      publishedAt: daysAgo(35),
      isHomeReview: true,
      body: `Cedar blocks work by releasing a natural oil that moths avoid — but that oil fades over time, and most blocks need sanding every few months to refresh the scent. We tracked how long a batch stayed effective without any maintenance.

Untreated, unsanded cedar released a noticeably stronger scent for longer than pre-finished or lacquered blocks, since a sealed surface traps the oil instead of letting it evaporate slowly where it's needed.

For drawers specifically, blocks worked better than hanging sachets — sachets lose potency faster because they're more exposed to open air, while a drawer stays relatively closed.`,
    },
    {
      slug: "anti-tarnish-jewelry-box-worth-it",
      title: "Anti-Tarnish Jewelry Box: Worth the Extra $10",
      excerpt: "The lining makes the difference, not the finish.",
      category: "REVIEWS",
      imageLabel: "Jewelry box",
      publishedAt: daysAgo(32),
      body: `Anti-tarnish jewelry boxes cost a bit more than a standard lined box, and it's a fair question whether the upgrade is worth it. After six months of side-by-side storage — half our test jewelry in a standard box, half in an anti-tarnish one — the difference was visible.

The anti-tarnish lining is treated with a compound that absorbs sulfur compounds from the air before they reach the silver. Pieces in the treated box needed polishing far less often than the untreated side.

The exterior finish, hinge quality, and ring rolls versus flat slots made no measurable difference to tarnish — it's specifically the lining material doing the work, which is worth knowing before paying more for a box that looks nicer but uses standard felt.`,
    },

    {
      slug: "interview-mina-40-steamers",
      title: "Interview with Mina R.: On Testing 40 Steamers",
      excerpt: "The one metric that matters most.",
      category: "STORIES",
      imageLabel: "Interview",
      publishedAt: daysAgo(3),
      isRecentBlog: true,
      body: `Mina R. has tested more garment steamers than almost anyone we know outside a QA lab. We asked her what actually separates a good steamer from a forgettable one after forty units.

"Heat-up time gets all the attention in reviews, but water capacity is what determines whether you finish steaming a full outfit or have to stop and refill halfway through," she said. "A steamer that heats fast but holds four minutes of water isn't actually faster in practice."

Her other tell: how loud the unit is at full steam. Several fast-heating models she tested hissed loudly enough to wake a sleeping household — a detail that never shows up in a spec sheet but matters every single morning.`,
    },
    {
      slug: "elenas-closet-minimalist",
      title: "Elena's Closet: A Minimalist Wardrobe Story",
      excerpt: "Twelve pieces, worn every week.",
      category: "STORIES",
      imageLabel: "Minimalist wardrobe",
      publishedAt: daysAgo(5),
      isRecentBlog: true,
      body: `Elena rebuilt her closet around twelve pieces two years ago, after realizing most of what she owned went unworn for months at a time. We asked her what actually made the cut and what didn't survive the cut.

"Everything has to work with at least three other pieces," she said. "A statement item that only pairs with one specific outfit gets worn twice a year and then just sits there." That rule alone cut her closet by more than half.

The pieces that stayed are mostly neutral — cream, olive, a single black blazer — with color introduced through accessories instead. She says the smaller wardrobe made mornings faster and made her care about the condition of what's left, since each piece is worn far more often.`,
    },
    {
      slug: "mina-slow-fashion-interview",
      title: "Mina R.: A Deep Interview on Slow Fashion",
      excerpt: "Why she stopped buying seasonal.",
      category: "STORIES",
      imageLabel: "Slow fashion interview",
      publishedAt: daysAgo(7),
      isRecentBlog: true,
      body: `Three years ago Mina R. stopped buying anything tied to a seasonal collection. We talked to her about what prompted the change and what she does instead.

"I noticed I was buying the same silhouette every few months in a slightly different color, because the marketing made it feel new," she said. "Once I started tracking cost-per-wear, seasonal pieces were the worst value in my closet by a wide margin."

Her current approach: one considered purchase per quarter, chosen for fit and fabric rather than trend. She estimates she buys roughly a third of what she used to, and wears everything she owns significantly more.`,
    },
    {
      slug: "historic-first-lint-roller",
      title: "Historic Stories: The First Lint Roller",
      excerpt: "A short history of a household staple.",
      category: "STORIES",
      imageLabel: "Lint roller history",
      publishedAt: daysAgo(9),
      isRecentBlog: true,
      body: `The lint roller as we know it — a roll of adhesive sheets on a handle — didn't exist until the early 1950s, patented by a small Minnesota manufacturer looking for a use for leftover adhesive tape stock.

Before that, lint removal meant a damp cloth, a clothes brush, or in some households, wrapping tape around your own hand sticky-side-out — a trick still recommended today when you're out of rollers.

The basic design has barely changed in seventy years: a cardboard or plastic tube, a perforated adhesive roll, and a handle. Most "innovations" since then have been variations on refill sheet count and handle ergonomics rather than the core mechanism.`,
    },

    {
      slug: "jewelry-cleaner-prices-rising",
      title: "Jewelry Cleaner Prices Are Rising: Why and What to Buy Instead",
      excerpt: "A look at the anti-tarnish market this year.",
      category: "STORIES",
      imageLabel: "Jewelry cleaner prices",
      publishedAt: daysAgo(4),
      isSideStory: true,
      body: `Anti-tarnish jewelry cleaners have gotten noticeably more expensive this year, largely tracking the cost of the chelating agents used in the formulas. A few brands have quietly reduced bottle sizes while holding prices steady.

The good news: a simple baking-soda-and-warm-water soak, followed by a soft-cloth polish, handles routine silver tarnish nearly as well as most commercial dips for a fraction of the cost. Save the commercial cleaner for pieces with embedded stones, where the gentler pH matters more.

For gold and platinum, plain warm water with a drop of dish soap remains the safest and cheapest option — those metals don't tarnish the way silver does, so the stronger (and pricier) formulas aren't doing much extra work anyway.`,
    },
    {
      slug: "hand-wash-only-what-i-learned",
      title: "I Chose Hand-Wash Only, and Here's What I Learned",
      excerpt: "A season of slower laundry days.",
      category: "STORIES",
      imageLabel: "Hand-wash laundry",
      publishedAt: daysAgo(6),
      isSideStory: true,
      body: `One of our writers spent a season hand-washing every hand-wash-labeled item instead of risking the machine's gentle cycle, just to see what changed. The short version: fabric held its shape noticeably better, but the time cost was real.

Delicate sweaters and silk pieces that had been slowly losing shape in the machine's gentle cycle bounced back within a few hand-washes. The agitation difference is bigger than the "gentle" label implies — even a slow spin cycle puts more mechanical stress on fibers than hand agitation does.

The tradeoff: a load that took ninety seconds in the machine now took roughly fifteen minutes by hand, including a flat-dry setup. Worth it for a handful of good pieces; not something to do for an entire wardrobe.`,
    },

    {
      slug: "jewelry-box-buying-guide",
      title: "How to Choose a Jewelry Box That Actually Protects What's Inside",
      excerpt: "Anti-tarnish lining, ring rolls versus slots, and why the hinge matters more than the finish.",
      category: "GUIDES",
      imageLabel: "Jewelry box buying guide",
      publishedAt: daysAgo(1),
      body: `Most jewelry box shopping starts and ends with how the exterior looks — but the parts that actually protect your jewelry are the lining, the compartment layout, and the hardware, none of which show up in a product photo.

**Lining matters most.** An anti-tarnish lining, treated to absorb sulfur compounds from the air, measurably slows tarnish on silver pieces compared to standard felt. If you own more silver than gold, this is the single upgrade worth paying for.

**Ring rolls vs. flat slots.** Rolls keep rings upright and separated, which prevents the scratching that happens when rings sit loose in a shared tray. Flat slots work fine for rings you rarely move, but rolls are better for anything you wear and remove often.

**The hinge is the weak point.** A box gets opened and closed daily for years — a cheap hinge is usually the first thing to fail, long before the fabric or finish shows wear. Metal hinges set into the wood outlast surface-mounted plastic ones by a wide margin in our testing.

**Compartment count vs. compartment size.** More compartments looks impressive in photos, but oversized necklaces and bracelets need room to lie flat without folding. A box with fewer, larger compartments often protects more than one crammed with tiny dividers.`,
    },
  ]);

  // ---------------- site categories ----------------
  await db.insert(siteCategories).values([
    { label: "Clothing Care", section: "sidebar", sortOrder: 1 },
    { label: "Accessories", section: "sidebar", sortOrder: 2 },
    { label: "Wardrobe Storage", section: "sidebar", sortOrder: 3 },
    { label: "Jewelry & Watches", section: "sidebar", sortOrder: 4 },
    { label: "Bags", section: "sidebar", sortOrder: 5 },
    { label: "Steamers", section: "sidebar", sortOrder: 6 },
    { label: "Storage Bins", section: "sidebar", sortOrder: 7 },
    { label: "Cleaning Tools", section: "sidebar", sortOrder: 8 },

    { label: "Fashion", icon: "👗", colorHex: "#f6eff8", section: "explore", sortOrder: 1 },
    { label: "Beauty", icon: "🧴", colorHex: "#f3c6d6", section: "explore", sortOrder: 2 },
    { label: "Electronics", icon: "🎧", colorHex: "#efe3f2", section: "explore", sortOrder: 3 },
    { label: "Home", icon: "🛋", colorHex: "#e8f0e4", section: "explore", sortOrder: 4 },
    { label: "Sports", icon: "👟", colorHex: "#f6eff8", section: "explore", sortOrder: 5 },
    { label: "More", icon: "☰", colorHex: "#f3e6d0", section: "explore", sortOrder: 6 },
  ]);

  // ---------------- demo user accounts ----------------
  // These are display/seed accounts only — no login credentials are
  // created, so they can't sign in (that's fine; real visitors sign up for
  // their own account through /signup). The official account is the one
  // used for editorially-curated posts.
  await db.delete(likes);
  await db.delete(comments);
  await db.delete(user).where(eq(user.handle, "lilacdrawer"));
  await db.delete(user).where(eq(user.handle, "minastyle"));
  await db.delete(user).where(eq(user.handle, "elenawears"));
  await db.delete(user).where(eq(user.handle, "closetedit"));

  const officialUserId = randomUUID();
  const minaUserId = randomUUID();
  const elenaUserId = randomUUID();
  const closetEditUserId = randomUUID();

  await db.insert(user).values([
    { id: officialUserId, name: "Lilac Drawer", email: "hello@lilacdrawer.com", handle: "lilacdrawer", bio: "Honest reviews and buying guides, tested by hand.", emailVerified: true },
    { id: minaUserId, name: "Mina R.", email: "mina@example.com", handle: "minastyle", bio: "Slow fashion, tested and worn.", emailVerified: true },
    { id: elenaUserId, name: "Elena", email: "elena@example.com", handle: "elenawears", bio: "Twelve pieces, worn every week.", emailVerified: true },
    { id: closetEditUserId, name: "The Closet Edit", email: "closetedit@example.com", handle: "closetedit", bio: "Wardrobe organization, one drawer at a time.", emailVerified: true },
  ]);

  // ---------------- trends ----------------
  await db.insert(trends).values([
    { category: "Style", tag: "Pastel Dreamcore", postCount: 12300 },
    { category: "Care", tag: "Wardrobe Storage", postCount: 4100 },
    { category: "Trending", tag: "Soft Editorial", postCount: 8700 },
    { category: "Style", tag: "Cottagecore Accessories", postCount: 3500 },
  ]);

  // ---------------- community posts ----------------
  const hoursAgo = (n: number) => new Date(now - n * 3600000);

  const [jewelryBox] = await db.select().from(products).where(eq(products.slug, "anti-tarnish-jewelry-box")).limit(1);
  const [cedarBlocks] = await db.select().from(products).where(eq(products.slug, "cedar-wood-sweater-blocks-6pk")).limit(1);

  const [postA] = await db.insert(communityPosts).values({
    userId: officialUserId,
    body: "Found the softest lavender cardigan for fall layering. Full review up on the site.",
    hasImage: true,
    imageLabel: "Lavender cardigan",
    postedAt: hoursAgo(2),
    likeCount: 94,
  }).returning();

  const [postB] = await db.insert(communityPosts).values({
    userId: minaUserId,
    productId: jewelryBox?.id,
    body: "Anti-tarnish jewelry boxes are actually worth the extra $10. Learned this the hard way.",
    hasImage: false,
    postedAt: hoursAgo(4),
    likeCount: 31,
  }).returning();

  const [postC] = await db.insert(communityPosts).values({
    userId: officialUserId,
    body: "This week's pastel dreamcore roundup: soft knits, pearl clips, and the return of the ballet flat.",
    hasImage: true,
    imageLabel: "Pastel dreamcore roundup",
    postedAt: hoursAgo(6),
    likeCount: 210,
  }).returning();

  const [postD] = await db.insert(communityPosts).values({
    userId: elenaUserId,
    productId: cedarBlocks?.id,
    body: "The cedar blocks actually work. My sweaters have never smelled better.",
    hasImage: false,
    postedAt: hoursAgo(9),
    likeCount: 18,
  }).returning();

  // A repost-with-opinion: closetEdit reposts postB with her own take.
  await db.insert(communityPosts).values({
    userId: closetEditUserId,
    repostOfId: postB.id,
    body: "Seconding this — switched mine over last month and the difference is real.",
    postedAt: hoursAgo(2),
    likeCount: 6,
  });
  await db.update(communityPosts).set({ repostCount: 1 }).where(eq(communityPosts.id, postB.id));

  // Sample comments (also bump each post's commentCount to match).
  await db.insert(comments).values([
    { postId: postA.id, userId: minaUserId, body: "Where's this from? Need it immediately.", createdAt: hoursAgo(1) },
    { postId: postA.id, userId: elenaUserId, body: "Lavender is having such a moment right now.", createdAt: hoursAgo(1) },
    { postId: postB.id, userId: closetEditUserId, body: "Wish I'd known this before buying my first one.", createdAt: hoursAgo(3) },
    { postId: postD.id, userId: officialUserId, body: "Glad it's working for you — full review is up on the blog.", createdAt: hoursAgo(8) },
  ]);
  await db.update(communityPosts).set({ commentCount: 2 }).where(eq(communityPosts.id, postA.id));
  await db.update(communityPosts).set({ commentCount: 1 }).where(eq(communityPosts.id, postB.id));
  await db.update(communityPosts).set({ commentCount: 1 }).where(eq(communityPosts.id, postD.id));

  // Sample likes (kept small and consistent with the likeCount values above).
  await db.insert(likes).values([
    { postId: postA.id, userId: minaUserId },
    { postId: postA.id, userId: elenaUserId },
    { postId: postB.id, userId: officialUserId },
    { postId: postC.id, userId: minaUserId },
    { postId: postD.id, userId: minaUserId },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
