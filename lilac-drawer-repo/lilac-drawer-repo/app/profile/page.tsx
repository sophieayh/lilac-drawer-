import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Profile",
  description: "Sign in to view your Lilac Drawer profile.",
  robots: { index: false, follow: true },
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    // The user's own public profile lives at /community/[handle] — this
    // avoids maintaining a second, near-duplicate profile template that
    // would otherwise compete with it for search ranking.
    redirect(`/community/${(session.user as { handle?: string }).handle}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-cream text-purple-deep min-h-screen flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="font-heading text-3xl mb-4 text-purple-deep">Sign in to view your profile</h1>
        <p className="text-tan-dark mb-6 max-w-[380px]">
          Create a free account to post, comment, and like in the Lilac Drawer community.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="border-[1.5px] border-lilac text-purple px-6 py-3 rounded-full font-semibold text-sm">
            Log In
          </Link>
          <Link href="/signup" className="bg-lilac text-white px-6 py-3 rounded-full font-semibold text-sm">
            Sign Up
          </Link>
        </div>
      </main>
    </>
  );
}
