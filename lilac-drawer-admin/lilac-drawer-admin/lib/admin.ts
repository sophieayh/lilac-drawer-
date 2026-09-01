import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/**
 * Redirects signed-out visitors to /login and signed-in non-admins to a
 * "not allowed" screen. Call this at the top of the root layout (covers
 * every page) and again inside every server action, since actions run
 * independently of the layout that rendered the form that called them.
 */
export async function requireAdmin() {
  const authUser = await getSessionUser();
  if (!authUser) {
    redirect("/login");
  }
  if (authUser.role !== "admin") {
    redirect("/not-authorized");
  }
  return authUser;
}
