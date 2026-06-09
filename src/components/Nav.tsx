"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const links = [
  { href: "/groups", label: "Group Picks" },
  { href: "/knockout", label: "Knockout" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
];

type SessionUser = {
  entryName: string;
  firstName: string;
  lastName: string;
};

export function Nav() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  const loadUser = useCallback(async () => {
    const response = await fetch("/api/auth/me");
    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void loadUser();
    window.addEventListener("pool-auth-changed", loadUser);
    return () => window.removeEventListener("pool-auth-changed", loadUser);
  }, [loadUser]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.dispatchEvent(new Event("pool-auth-changed"));
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          World Cup Pool
        </Link>
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:items-center sm:overflow-visible sm:px-0 sm:pb-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white sm:py-1.5"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <span className="px-2 text-xs text-zinc-500">
                {user.entryName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:py-1.5"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="shrink-0 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:py-1.5"
            >
              Log in
            </Link>
          )}
          <Link
            href="/admin"
            className="shrink-0 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 sm:py-1.5"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
