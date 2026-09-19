"use client";

import { useState, useEffect, useTransition } from "react";
import { subscribeNewsletter } from "@/lib/newsletter-actions";

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSubscribed?: () => void;
}

export default function SubscribeModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSubscribed,
}: SubscribeModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail, email]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
          setSuccessMsg(res.message);
          // Mark in localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("lilac_newsletter_subscribed", "true");
            localStorage.setItem("lilac_subscribed_email", trimmed);
            window.dispatchEvent(new Event("lilac-subscribed"));
          }
          if (onSubscribed) onSubscribed();
          setTimeout(() => {
            onClose();
          }, 1800);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to subscribe. Please try again.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-border shadow-2xl w-full max-w-md overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border/70 bg-gradient-to-r from-mauve-50 via-pink-50/50 to-mauve-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-deep text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-purple-deep">
                Join the Lilac Club
              </h3>
              <p className="text-[11px] text-rose font-semibold uppercase tracking-wider">
                Newsletter & VIP Deals
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-mauve-100 flex items-center justify-center text-tan hover:text-purple-deep transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successMsg ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-heading text-lg font-bold text-purple-deep">
                You&apos;re Subscribed!
              </h4>
              <p className="text-xs text-tan-dark max-w-[280px] mx-auto leading-relaxed">
                {successMsg}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs leading-relaxed text-tan-dark">
                Subscribe to receive our weekly curated honest reviews, exclusive price drops, tested beauty finds, and wardrobe care guides directly in your inbox.
              </p>

              <div>
                <label htmlFor="subscribe-modal-email" className="block text-xs font-bold text-purple-deep uppercase tracking-wider mb-1.5">
                  Your Email Address
                </label>
                <div className="relative">
                  <input
                    id="subscribe-modal-email"
                    type="email"
                    required
                    autoFocus
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-mauve-50/40 text-purple-deep outline-none focus:border-lilac focus:ring-2 focus:ring-lilac/20 transition-all placeholder:text-tan"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose/10 border border-rose/30 rounded-xl text-xs text-rose font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 text-rose shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-tan-dark hover:bg-mauve-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-lilac hover:bg-purple-deep text-white rounded-full px-6 py-2.5 text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isPending ? (
                    <span>Subscribing…</span>
                  ) : (
                    <span>Subscribe to Newsletter</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
