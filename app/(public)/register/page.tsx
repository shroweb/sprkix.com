"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [socialProviders, setSocialProviders] = useState<{
    enabled: boolean;
    google: boolean;
    facebook: boolean;
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const user = await res.json();
          if (user && user.id) { router.push("/"); return; }
        }
      } catch {}
      setCheckingUser(false);
    })();

    fetch("/api/auth/social-providers")
      .then((r) => r.json())
      .then(setSocialProviders)
      .catch(() => setSocialProviders({ enabled: false, google: false, facebook: false }));
  }, [router]);

  if (checkingUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name || !email || !password || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Account created! Redirecting..." });
        setTimeout(() => { window.location.href = "/"; }, 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Registration failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Connection error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pw: string) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: "Too short", color: "bg-red-500", width: "w-1/4" };
    if (pw.length < 8) return { label: "Weak", color: "bg-orange-400", width: "w-2/4" };
    if (pw.length < 12 || !/[0-9]/.test(pw)) return { label: "Good", color: "bg-yellow-400", width: "w-3/4" };
    return { label: "Strong", color: "bg-emerald-400", width: "w-full" };
  };

  const strength = passwordStrength(password);
  const showSocial = socialProviders?.enabled && (socialProviders.google || socialProviders.facebook);

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400/40 transition-all font-medium text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      {/* Background accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-yellow-400/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-yellow-400/0 via-yellow-400 to-yellow-400/0" />

          <div className="p-8 sm:p-10 space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                Join Poison Rana
              </h1>
              <p className="text-gray-400 text-sm">
                Rate. Review. Predict. Discuss.
              </p>
            </div>

            {/* Social buttons */}
            {showSocial && (
              <div className="space-y-3">
                {socialProviders?.google && (
                  <a
                    href="/api/auth/google"
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-gray-800 font-bold text-sm hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </a>
                )}
                {socialProviders?.facebook && (
                  <a
                    href="/api/auth/facebook"
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-[#1877F2] text-white font-bold text-sm hover:bg-[#166FE5] transition-colors"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </a>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-500 font-medium">or sign up with email</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="username"
                className={inputClass}
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className={inputClass}
              />
              <div className="space-y-1.5">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  className={inputClass}
                />
                {strength && (
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className={`text-[10px] font-bold ${strength.color.replace("bg-", "text-")}`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className={`${inputClass} ${confirmPassword && confirmPassword !== password ? "border-red-500/40 focus:ring-red-500/40" : confirmPassword && confirmPassword === password ? "border-emerald-500/40 focus:ring-emerald-500/40" : ""}`}
              />

              {message && (
                <div className={`px-4 py-3 rounded-xl text-sm font-bold text-center ${
                  message.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-300 transition-all uppercase italic tracking-widest shadow-lg shadow-yellow-400/20 disabled:opacity-50 active:scale-[0.98] mt-2"
              >
                {loading ? "Creating Account…" : "Create Account"}
              </button>
            </form>

            <p className="text-center text-gray-600 text-[11px]">
              By joining, you agree to our{" "}
              <span className="text-gray-400 hover:text-white cursor-pointer transition-colors">
                community guidelines
              </span>
            </p>
          </div>
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
