"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";

type Tab = "login" | "signup";

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          router.replace("/groups");
          return;
        }
      } finally {
        setChecking(false);
      }
    }

    checkSession();
  }, [router]);

  if (checking) {
    return <p className="text-zinc-500">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          FIFA World Cup 2026 Pool
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Sign up with your name and a password, or log in to continue your
          picks on any device.
        </p>
      </div>

      <div className="mx-auto flex max-w-md rounded-xl border border-zinc-200 p-1 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "login"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setTab("signup")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "signup"
              ? "bg-emerald-600 text-white"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Sign up
        </button>
      </div>

      {tab === "login" ? <LoginForm /> : <SignupForm />}
    </div>
  );
}
