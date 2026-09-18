"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/profile";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy to create an account.");
      return;
    }

    setLoading(true);
    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanHandle.length < 3) {
      setError("Username must be at least 3 characters (letters, numbers, underscore).");
      setLoading(false);
      return;
    }
    const reservedHandles = ["post", "api"];
    if (reservedHandles.includes(cleanHandle)) {
      setError("That username isn't available. Please choose another.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      // @ts-expect-error -- handle is a configured additionalField in better-auth
      handle: cleanHandle,
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message ?? "Something went wrong. Try a different email or username.");
      return;
    }

    router.push(redirectTo !== "/profile" ? redirectTo : `/community/${cleanHandle}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-[420px] mx-auto bg-white/85 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-border shadow-[0_12px_36px_rgba(90,47,69,0.08)]">
      <div>
        <label htmlFor="name" className="block text-xs font-bold text-purple-deep uppercase tracking-wider mb-1.5">
          Full Name
        </label>
        <input
          id="name"
          required
          placeholder="e.g. Sophia Miller"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-cream-alt text-purple-deep outline-none focus:border-lilac focus:ring-2 focus:ring-lilac/20 transition-all"
        />
      </div>

      <div>
        <label htmlFor="handle" className="block text-xs font-bold text-purple-deep uppercase tracking-wider mb-1.5">
          Username
        </label>
        <div className="flex items-center border border-border rounded-xl px-3.5 bg-cream-alt focus-within:border-lilac focus-within:ring-2 focus-within:ring-lilac/20 transition-all">
          <span className="text-tan text-sm font-semibold select-none">@</span>
          <input
            id="handle"
            required
            placeholder="sophia_m"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full py-2.5 pl-1.5 text-sm bg-transparent text-purple-deep outline-none"
          />
        </div>
      </div>

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
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-cream-alt text-purple-deep outline-none focus:border-lilac focus:ring-2 focus:ring-lilac/20 transition-all"
          />
        </div>
      </div>

      {/* Checkboxes Section */}
      <div className="flex flex-col gap-3 pt-2 border-t border-border/70">
        {/* Checkbox 1: Terms & Conditions (Required) */}
        <label htmlFor="agreeTerms" className="flex items-start gap-2.5 cursor-pointer text-xs text-purple-deep/90 leading-relaxed select-none">
          <input
            id="agreeTerms"
            type="checkbox"
            required
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-rose border-border focus:ring-rose accent-rose cursor-pointer shrink-0"
          />
          <span>
            I agree to the{" "}
            <Link href="/blog" target="_blank" className="text-rose font-bold hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/blog" target="_blank" className="text-rose font-bold hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {/* Checkbox 2: Email Newsletter */}
        <label htmlFor="subscribeNewsletter" className="flex items-start gap-2.5 cursor-pointer text-xs text-purple-deep/90 leading-relaxed select-none">
          <input
            id="subscribeNewsletter"
            type="checkbox"
            checked={subscribeNewsletter}
            onChange={(e) => setSubscribeNewsletter(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-rose border-border focus:ring-rose accent-rose cursor-pointer shrink-0"
          />
          <span>
            Subscribe to our weekly newsletter for curated honest reviews and exclusive deals.
          </span>
        </label>
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
        {loading ? "Creating account…" : "Create Account"}
      </button>

      <p className="text-xs text-tan text-center mt-1">
        Already have an account?{" "}
        <Link
          href={`/login${redirectTo !== "/profile" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-rose font-bold hover:underline"
        >
          Log In
        </Link>
      </p>
    </form>
  );
}

