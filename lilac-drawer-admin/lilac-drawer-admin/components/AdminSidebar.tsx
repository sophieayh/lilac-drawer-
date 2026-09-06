"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-white" : "text-purple-deep/70 group-hover:text-purple-deep"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/articles",
    label: "Articles",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-white" : "text-purple-deep/70 group-hover:text-purple-deep"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    href: "/placements",
    label: "Site Placements",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-white" : "text-purple-deep/70 group-hover:text-purple-deep"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h17.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    href: "/categories",
    label: "Categories & Menus",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-white" : "text-purple-deep/70 group-hover:text-purple-deep"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: "/products",
    label: "Products & Links",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-white" : "text-purple-deep/70 group-hover:text-purple-deep"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    href: "/banners",
    label: "Banners & Ads",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-white" : "text-purple-deep/70 group-hover:text-purple-deep"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.01 5.395m-1.01 8.355c.34-1.74.52-3.53.52-5.355 0-.025 0-.05 0-.075" />
      </svg>
    ),
  },
  {
    href: "/yearly-wrap",
    label: "Yearly Wrap",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-white" : "text-purple-deep/70 group-hover:text-purple-deep"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    href: "/users",
    label: "Users & Roles",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-white" : "text-purple-deep/70 group-hover:text-purple-deep"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
];

export default function AdminSidebar({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const isHorizontal = orientation === "horizontal";

  return (
    <nav className={isHorizontal ? "flex gap-1.5" : "flex flex-col gap-1.5 px-3 py-4"}>
      {navItems.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold whitespace-nowrap transition-all ${
              isActive
                ? "bg-purple-deep text-white shadow-sm ring-1 ring-white/10"
                : "text-ink/80 hover:text-purple-deep hover:bg-mauve-100/70"
            }`}
          >
            <span className="shrink-0">{item.icon(isActive)}</span>
            <span className={isActive ? "!text-white" : ""}>{item.label}</span>
            {isActive && !isHorizontal && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-light" aria-hidden="true" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
