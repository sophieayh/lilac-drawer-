import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-[360px]">
      <p className="font-heading text-lg text-center mb-1 text-purple-deep">
        Lilac Drawer <span className="text-rose">Admin</span>
      </p>
      <h1 className="text-sm text-center text-tan-dark mb-8">Sign in with your site account</h1>
      <LoginForm />
    </div>
  );
}
