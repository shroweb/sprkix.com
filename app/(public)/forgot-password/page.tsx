"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
  };

  return (
    <div className="py-20 px-4 flex justify-center">
      <div className="w-full max-w-sm space-y-4">
        {submitted ? (
          <div className="backdrop-blur p-8 rounded-2xl shadow-lg border border-white/10 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-white">Check your email</h1>
            <p className="text-muted-foreground text-sm">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset
              link. It expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="inline-block text-sm font-bold text-primary hover:underline"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 backdrop-blur p-8 rounded-2xl shadow-lg border border-white/10"
          >
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-white text-center">Forgot Password</h1>
              <p className="text-sm text-muted-foreground text-center">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
