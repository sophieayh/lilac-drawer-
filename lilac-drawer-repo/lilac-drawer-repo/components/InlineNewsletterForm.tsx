"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/lib/newsletter-actions";

interface InlineNewsletterFormProps {
  id?: string;
  placeholder?: string;
  buttonText?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

export default function InlineNewsletterForm({
  id = "newsletter-email",
  placeholder = "you@email.com",
  buttonText = "Subscribe",
  className = "flex justify-center gap-3 max-w-[420px] mx-auto",
  inputClassName = "flex-1 px-4.5 py-3.5 border-[1.5px] border-rose rounded-lg text-sm bg-cream-alt text-purple-deep outline-none focus:ring-2 focus:ring-rose/30 transition-all",
  buttonClassName = "bg-plum hover:bg-purple-deep text-white px-5.5 py-3.5 rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(90,47,69,0.25)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
}: InlineNewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await subscribeNewsletter(trimmed);
        if (res.success) {
          setSuccess(res.message);
          setEmail("");
          if (typeof window !== "undefined") {
            localStorage.setItem("lilac_newsletter_subscribed", "true");
            localStorage.setItem("lilac_subscribed_email", trimmed.toLowerCase());
            window.dispatchEvent(new Event("lilac-subscribed"));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to subscribe. Please try again.");
      }
    });
  }

  if (success) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-[420px] mx-auto text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Subscribed Successfully</span>
        </div>
        <p className="text-xs text-emerald-700">{success}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className={className}>
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <input
          id={id}
          type="email"
          required
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          className={inputClassName}
        />
        <button
          type="submit"
          disabled={isPending}
          className={buttonClassName}
        >
          {isPending ? "Subscribing…" : buttonText}
        </button>
      </form>
      {error && (
        <p className="text-xs text-rose font-semibold mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
