/**
 * Static UI/navigation configuration only. All page content (products,
 * posts, community feed, trends, people) now lives in the database — see
 * db/schema.ts and db/queries.ts.
 */

export const exploreNavItems = [
  { icon: "\u2302", label: "Home", href: "/" },
  { icon: "\u2637", label: "Categories", href: "/explore" },
  { icon: "\u2661", label: "Deals", href: "/deals", badge: "Hot" },
  { icon: "\u2726", label: "New Arrivals", href: "/deals" },
  { icon: "\u2b50", label: "Best Sellers", href: "/deals" },
  { icon: "\u25C8", label: "Buying Guides", href: "/blog" },
  { icon: "\u2630", label: "Blog", href: "/blog" },
  { icon: "\u2699", label: "Account", href: "/profile" },
];

export const communityNavItems = [
  { icon: "\u2302", label: "Home", href: "/" },
  { icon: "\u26B2", label: "Explore", href: "/explore" },
  { icon: "\u2764", label: "Notifications", href: "/community" },
  { icon: "\u2709", label: "Messages", href: "/community" },
  { icon: "\u2661", label: "Saved", href: "/community" },
  { icon: "\u25CE", label: "Profile", href: "/profile" },
];

export const profileTabs = ["Posts", "Replies", "Media", "Likes"];
