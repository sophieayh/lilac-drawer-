import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your Lilac Drawer account.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream text-purple-deep min-h-screen py-16 px-6">
        <h1 className="font-heading text-3xl text-center mb-8 text-purple-deep">Log in</h1>
        <LoginForm />
      </main>
    </>
  );
}
