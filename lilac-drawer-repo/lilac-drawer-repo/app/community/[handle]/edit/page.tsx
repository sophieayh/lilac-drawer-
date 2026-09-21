import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { auth } from "@/lib/auth";
import { getUserByHandle } from "@/db/queries";
import EditProfileForm from "./EditProfileForm";

export const metadata: Metadata = {
  title: "Edit Profile",
  robots: { index: false, follow: false },
};

export default async function EditProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  // Only the account itself can edit its profile — signed-out visitors and
  // anyone viewing someone else's handle get sent back to the public page.
  if (!session?.user || session.user.handle !== handle) {
    redirect(`/community/${handle}`);
  }

  const person = await getUserByHandle(handle);
  if (!person) redirect("/community");

  return (
    <>
      <SiteHeader />
      <main className="bg-cream text-purple-deep min-h-screen">
        <div className="max-w-[1020px] mx-auto px-3.5 sm:px-6 md:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h1 className="font-heading text-2xl sm:text-3xl text-purple-deep">Edit Profile</h1>
            <Link
              href={`/community/${handle}`}
              className="text-xs font-bold text-purple-deep hover:text-rose bg-white px-4 py-2 rounded-full border border-border shadow-2xs transition-colors"
            >
              View Profile
            </Link>
          </div>
          <EditProfileForm
            handle={person.handle}
            initialName={person.name}
            initialBio={person.bio ?? ""}
            initialImage={person.image ?? ""}
            initialCoverImage={person.coverImage ?? ""}
            initialCoverPosition={person.coverPosition ?? "50"}
          />
        </div>
      </main>
    </>
  );
}
