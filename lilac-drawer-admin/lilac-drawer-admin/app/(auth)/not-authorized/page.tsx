import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not authorized",
};

export default function NotAuthorizedPage() {
  return (
    <div className="text-center max-w-sm">
      <p className="font-heading text-2xl text-purple-deep mb-2">Not authorized</p>
      <p className="text-sm text-tan-dark">
        You&apos;re signed in, but this account doesn&apos;t have admin access. Ask an existing admin to grant it from the Users page.
      </p>
    </div>
  );
}
