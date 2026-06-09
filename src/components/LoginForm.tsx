"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to log in");
      }

      window.dispatchEvent(new Event("pool-auth-changed"));
      router.push("/groups");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="login-first">
          First name
        </label>
        <input
          id="login-first"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="login-last">
          Last name
        </label>
        <input
          id="login-last"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {loading ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
