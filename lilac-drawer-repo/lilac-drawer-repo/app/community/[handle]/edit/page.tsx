import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
        <div className="max-w-[480px] mx-auto px-6 py-10">
          <h1 className="font-heading text-2xl text-purple-deep mb-6">Edit Profile</h1>
          <EditProfileForm handle={person.handle} initialName={person.name} initialBio={person.bio ?? ""} initialImage={person.image ?? ""} />
        </div>
      </main>
    </>
  );
}
