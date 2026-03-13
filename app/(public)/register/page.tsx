"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("../../api/auth/me");
        if (res.ok) {
          const user = await res.json();
          if (user && user.id) {
            router.push("/");
            return;
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
      setCheckingUser(false);
    })();
  }, [router]);

  if (checkingUser) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Basic Validation
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
        // Small delay to let user see success message
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Registration failed." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Connection error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 px-4 flex justify-center bg-black/50 min-h-screen items-center">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 backdrop-blur-xl bg-white/5 p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/10"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Join sprkix
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            The definitive wrestling archive
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium"
          />
          <div className="grid grid-cols-1 gap-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl hover:bg-yellow-300 transition-all uppercase italic tracking-widest shadow-xl shadow-yellow-400/10 disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold text-center ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {message.text}
          </div>
        )}

        <p className="text-center text-gray-500 text-xs">
          By joining, you agree to our community guidelines.
        </p>
      </form>
    </div>
  );
}
