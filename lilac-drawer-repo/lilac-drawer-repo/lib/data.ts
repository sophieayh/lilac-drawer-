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
  { icon: "\u2699", label: "Community", href: "/community" },
];

export const communityNavItems = [
  { icon: "\u2302", label: "Home", href: "/" },
  { icon: "\u26B2", label: "Explore", href: "/explore" },
  { icon: "\u2764", label: "Notifications", href: "/notifications" },
  { icon: "\u2709", label: "Messages", href: "/community" },
  { icon: "\u2661", label: "Saved", href: "/community" },
  { icon: "\u25CE", label: "Community", href: "/community" },
];

export const profileTabs = ["Posts", "Replies", "Media", "Likes"];

export interface CoverPositionData {
  x: number; // 0 to 100, default 50
  y: number; // 0 to 100, default 50
  z: number; // 1.0 to 3.0, default 1
}

export function parseCoverPosition(val: unknown): CoverPositionData {
  if (!val) return { x: 50, y: 50, z: 1 };
  if (typeof val === "number") {
    return { x: 50, y: Math.min(100, Math.max(0, val)), z: 1 };
  }
  if (typeof val === "string") {
    try {
      if (val.startsWith("{")) {
        const parsed = JSON.parse(val);
        return {
          x: typeof parsed.x === "number" ? Math.min(100, Math.max(0, parsed.x)) : 50,
          y: typeof parsed.y === "number" ? Math.min(100, Math.max(0, parsed.y)) : 50,
          z: typeof parsed.z === "number" ? Math.min(3, Math.max(1, parsed.z)) : 1,
        };
      }
      if (val.includes(",")) {
        const parts = val.split(",").map(Number);
        return {
          x: !isNaN(parts[0]) ? Math.min(100, Math.max(0, parts[0])) : 50,
          y: !isNaN(parts[1]) ? Math.min(100, Math.max(0, parts[1])) : 50,
          z: !isNaN(parts[2]) ? Math.min(3, Math.max(1, parts[2])) : 1,
        };
      }
      const num = Number(val);
      if (!isNaN(num)) {
        return { x: 50, y: Math.min(100, Math.max(0, num)), z: 1 };
      }
    } catch {}
  }
  return { x: 50, y: 50, z: 1 };
}
