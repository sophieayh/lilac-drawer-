"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview", icon: "📊" },
  { href: "/users", label: "Users", icon: "👥" },
  { href: "/articles", label: "Articles", icon: "📝" },
  { href: "/products", label: "Products & Links", icon: "🔗" },
];

export default function AdminSidebar({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const isHorizontal = orientation === "horizontal";

  return (
    <nav className={isHorizontal ? "flex gap-1" : "flex flex-col gap-1 p-4"}>
      {links.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
              isActive ? "bg-lilac text-white" : "text-purple-deep hover:bg-mauve-50"
            }`}
          >
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
