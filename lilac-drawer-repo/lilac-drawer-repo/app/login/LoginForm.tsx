"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/profile";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await authClient.signIn.email({ email: email.trim(), password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message || "Incorrect email or password. Please try again.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-[400px] mx-auto bg-white/85 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-border shadow-[0_12px_36px_rgba(90,47,69,0.08)]">
      <div>
        <label htmlFor="email" className="block text-xs font-bold text-purple-deep uppercase tracking-wider mb-1.5">
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
        <div className="flex justify-between items-baseline mb-1.5">
          <label htmlFor="password" className="block text-xs font-bold text-purple-deep uppercase tracking-wider">
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-[11px] font-semibold text-rose hover:underline"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-cream-alt text-purple-deep outline-none focus:border-lilac focus:ring-2 focus:ring-lilac/20 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose/10 border border-rose/30 rounded-xl text-xs text-rose font-semibold leading-snug flex items-center gap-2">
          <svg className="w-4 h-4 text-rose shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-lilac hover:bg-purple-deep text-white rounded-full py-3 font-bold text-xs shadow-[0_4px_14px_rgba(201,163,198,0.4)] transition-all btn-press disabled:opacity-50 disabled:cursor-not-allowed mt-1 cursor-pointer"
      >
        {loading ? "Signing in…" : "Log In"}
      </button>

      <p className="text-xs text-tan text-center mt-1">
        Don&apos;t have an account yet?{" "}
        <Link
          href={`/signup${redirectTo !== "/profile" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-rose font-bold hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

