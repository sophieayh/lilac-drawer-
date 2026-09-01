"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanHandle.length < 3) {
      setError("Username must be at least 3 characters (letters, numbers, underscore).");
      setLoading(false);
      return;
    }
    // These collide with real routes under /community/[handle] (e.g. "post"
    // is also /community/post/[id]) — a user with one of these usernames
    // would find their own profile 404ing, since Next.js matches the
    // static route segment before the dynamic [handle] one.
    const reservedHandles = ["post", "api"];
    if (reservedHandles.includes(cleanHandle)) {
      setError("That username isn't available. Please choose another.");
      setLoading(false);
      return;
    }
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      // @ts-expect-error -- handle is a configured additionalField, not in the base type
      handle: cleanHandle,
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message ?? "Something went wrong. Try a different email or username.");
      return;
    }
    router.push(`/community/${cleanHandle}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-[360px] mx-auto">
      <div>
        <label htmlFor="name" className="block text-xs font-semibold text-purple-deep mb-1.5">
          Name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none"
        />
      </div>
      <div>
        <label htmlFor="handle" className="block text-xs font-semibold text-purple-deep mb-1.5">
          Username
        </label>
        <div className="flex items-center border border-border rounded-lg px-3.5">
          <span className="text-tan text-sm">@</span>
          <input
            id="handle"
            required
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full py-2.5 pl-1 text-sm outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-purple-deep mb-1.5">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none"
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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none"
        />
      </div>
      {error && <p className="text-xs text-rose">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-lilac text-white rounded-full py-3 font-semibold text-sm disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Sign Up"}
      </button>
      <p className="text-xs text-tan text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-rose font-semibold">
          Log in
        </Link>
      </p>
    </form>
  );
}
