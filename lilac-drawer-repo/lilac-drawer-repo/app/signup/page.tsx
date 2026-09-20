import type { Metadata } from "next";
import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a free Lilac Drawer account to post, comment, and like in the community.",
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream text-purple-deep min-h-screen py-10 sm:py-16 px-4 sm:px-6">
        <h1 className="font-heading text-2xl sm:text-3xl text-center mb-6 sm:mb-8 text-purple-deep">Create your account</h1>
        <Suspense fallback={<div className="max-w-[420px] mx-auto text-center py-8 text-xs text-tan">Loading…</div>}>
          <SignupForm />
        </Suspense>
      </main>
    </>
  );
}
