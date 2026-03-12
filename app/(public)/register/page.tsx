"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [checkingUser, setCheckingUser] = useState(true);

  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("../../api/auth/me");
      if (res.ok) {
        const user = await res.json();
        if (user && typeof user.slug === "string" && user.slug.trim() !== "") {
          router.push(`/user/${user.slug}`);
          return;
        }
      }
      setCheckingUser(false);
    })();
  }, []);

  if (checkingUser) {
    return null;
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setMessage(data.error || "Registration successful!");
  };

  return (
    <div className="py-20 px-4 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 backdrop-blur p-8 rounded-lg shadow-lg w-full max-w-sm border border-white/10"
      >
        <h1 className="text-2xl font-extrabold text-white text-center">
          Create your sprkix account
        </h1>
        <input
          type="text"
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          className="w-full bg-yellow-400 text-black font-bold py-3 rounded hover:bg-yellow-300 transition"
        >
          Register
        </button>
        {message && <p className="text-sm text-center text-white">{message}</p>}
      </form>
    </div>
  );
}
