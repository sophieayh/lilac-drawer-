"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      setError("Incorrect email or password.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  const field = "w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lilac";
  const labelCls = "block text-xs font-semibold text-purple-deep mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className={labelCls}>
          Email
        </label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </div>
      {error && <p className="text-xs text-rose">{error}</p>}
      <button type="submit" disabled={loading} className="bg-lilac text-white rounded-full py-3 font-semibold text-sm disabled:opacity-50">
        {loading ? "Signing in…" : "Log In"}
      </button>
      <p className="text-xs text-tan-dark text-center">
        No account here yet? Sign up on the main site, then have an existing admin grant you access from the Users page.
      </p>
    </form>
  );
}
