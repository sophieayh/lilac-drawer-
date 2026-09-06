"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Incorrect email or password. Please try again.");
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-[400px] mx-auto bg-white/70 backdrop-blur-xs p-6 md:p-8 rounded-2xl border border-border shadow-[0_8px_24px_rgba(90,47,69,0.06)]">
      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-purple-deep mb-1.5">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-cream-alt text-purple-deep outline-none focus:border-lilac focus:ring-2 focus:ring-lilac/20 transition-all"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-purple-deep mb-1.5">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-cream-alt text-purple-deep outline-none focus:border-lilac focus:ring-2 focus:ring-lilac/20 transition-all"
        />
      </div>

      {error && (
        <div className="p-3 bg-rose/10 border border-rose/30 rounded-xl text-xs text-rose font-medium leading-snug">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-lilac hover:bg-purple-deep text-white rounded-full py-3 font-semibold text-sm shadow-[0_4px_14px_rgba(201,163,198,0.4)] transition-all btn-press disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {loading ? "Signing in…" : "Log In"}
      </button>

      <p className="text-xs text-tan text-center mt-1">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="text-rose font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
