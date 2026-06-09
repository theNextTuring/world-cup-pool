"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EntryForm } from "@/components/EntryForm";
import { getStoredUserId } from "@/lib/client";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const userId = getStoredUserId();
    if (userId) {
      router.replace("/groups");
      return;
    }
    setChecking(false);
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
          Enter your name to join. No account needed — we&apos;ll remember you
          on this device.
        </p>
      </div>
      <EntryForm />
    </div>
  );
}
