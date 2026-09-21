import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const handle = (session?.user as { handle?: string })?.handle;

  if (handle) {
    redirect(`/community/${handle}`);
  }

  redirect("/community");
}
