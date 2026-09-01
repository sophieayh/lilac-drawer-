import type { Metadata } from "next";
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
      <main className="bg-cream text-purple-deep min-h-screen py-16 px-6">
        <h1 className="font-heading text-3xl text-center mb-8 text-purple-deep">Create your account</h1>
        <SignupForm />
      </main>
    </>
  );
}
