"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { newsletterApi } from "@/lib/api";

type Props = {
  source?: "blog_listing" | "blog_detail";
};

export default function BlogNewsletter({ source = "blog_listing" }: Props) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await newsletterApi.subscribe(trimmed, source);
      setIsDone(true);
      setEmail("");
      toast.success(res.message || "Welcome to The Inner Circle.");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not subscribe right now. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-account-surface-container-low py-account-stack-lg border-y border-account-outline-variant/30">
      <div className="max-w-account-container mx-auto px-account-margin-mobile md:px-account-margin-desktop text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-account-primary mb-account-stack-sm">
          The Inner Circle
        </h2>
        <p className="text-base md:text-lg text-account-on-surface-variant max-w-2xl mx-auto mb-account-stack-md italic">
          Join our journal to receive exclusive stories of craftsmanship and first
          access to new collections.
        </p>
        {isDone ?
          <p className="text-sm font-semibold text-account-secondary uppercase tracking-[0.12em]">
            You&apos;re on the list — thank you.
          </p>
        : <form
            className="max-w-md mx-auto flex gap-0 border-b border-account-primary"
            onSubmit={handleSubmit}
          >
            <input
              className="bg-transparent border-none focus:ring-0 w-full text-xs font-semibold uppercase tracking-widest placeholder:text-account-on-surface-variant/50 outline-none py-3"
              placeholder="YOUR EMAIL ADDRESS"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              aria-label="Email address"
              autoComplete="email"
              required
            />
            <button
              className="px-4 py-2 text-xs font-bold uppercase text-account-primary hover:text-account-secondary transition-colors shrink-0 disabled:opacity-50"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "…" : "Subscribe"}
            </button>
          </form>
        }
      </div>
    </section>
  );
}
