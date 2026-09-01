import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.PUBLIC_SITE_URL ?? "https://www.lilacdrawer.com";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-l border-border-mauve bg-white hidden md:flex md:flex-col">
        <Link href="/" className="px-4 pt-5 pb-2 font-heading text-lg text-purple-deep">
          Lilac Drawer <span className="text-rose">Admin</span>
        </Link>
        <AdminSidebar />
        <div className="mt-auto p-4 border-t border-border-mauve">
          <p className="text-xs text-tan-dark truncate">{admin.email}</p>
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-rose hover:underline">
            ↗ View live site
          </a>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between border-b border-border-mauve bg-white px-4 py-3">
          <Link href="/" className="font-heading text-base text-purple-deep">
            Admin
          </Link>
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-rose">
            ↗ Site
          </a>
        </header>
        <div className="md:hidden flex gap-1 overflow-x-auto border-b border-border-mauve bg-white px-3 py-2">
          <AdminSidebar orientation="horizontal" />
        </div>
        <main className="p-5 md:p-8 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
