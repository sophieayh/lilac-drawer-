import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen flex bg-[#fbf6f0]">
      {/* Desktop Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border-mauve bg-white hidden md:flex md:flex-col shadow-[2px_0_12px_rgba(46,37,54,0.03)] z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-border/80">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-rose flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              <span className="font-heading text-base font-bold">L</span>
            </div>
            <div>
              <div className="font-heading font-bold text-base text-purple-deep leading-none">
                Lilac Drawer
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose bg-pink-100/70 px-2 py-0.5 rounded-full inline-block mt-1">
                Admin Dashboard
              </span>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto">
          <AdminSidebar />
        </div>

        {/* Footer User & Live Site */}
        <div className="p-4 border-t border-border/80 bg-mauve-50/50">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-deep text-white font-bold text-xs flex items-center justify-center shrink-0">
              {admin.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-purple-deep truncate">{admin.email}</div>
              <div className="text-[10px] text-tan">Admin Account</div>
            </div>
          </div>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-white border border-border text-xs font-semibold !text-rose hover:border-rose transition-colors shadow-xs"
          >
            <span>View Live Website</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between border-b border-border-mauve bg-white px-4 py-3 sticky top-0 z-30">
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-base text-purple-deep">
            <div className="w-6 h-6 rounded-md bg-rose flex items-center justify-center text-white font-bold text-xs">
              L
            </div>
            Lilac Admin
          </Link>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold !text-rose bg-pink-100/60 px-2.5 py-1 rounded-full"
          >
            <span>Live Site</span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </header>
        <div className="md:hidden flex gap-1 overflow-x-auto border-b border-border-mauve bg-white px-3 py-2 sticky top-[49px] z-20">
          <AdminSidebar orientation="horizontal" />
        </div>
        <main className="p-5 md:p-8 max-w-6xl mx-auto w-full flex-1">{children}</main>
      </div>
    </div>
  );
}
