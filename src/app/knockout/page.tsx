"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bracket } from "@/components/Bracket";
import { SaveIndicator } from "@/components/SaveIndicator";
import { validPickCount } from "@/lib/bracket";
import { formatDeadlineET } from "@/lib/dates";
import type { KnockoutMatch } from "@/lib/supabase";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function KnockoutPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [tiebreaker, setTiebreaker] = useState("");
  const [locked, setLocked] = useState(false);
  const [published, setPublished] = useState(false);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loading, setLoading] = useState(true);
  const tiebreakerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, dataRes, settingsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/picks/knockout"),
          fetch("/api/settings"),
        ]);

        if (meRes.status === 401) {
          router.replace("/");
          return;
        }

        const data = await dataRes.json();
        const settingsData = await settingsRes.json();

        setMatches(data.matches ?? []);
        const pickMap: Record<string, string> = {};
        for (const pick of data.picks ?? []) {
          pickMap[pick.match_id] = pick.picked_winner;
        }
        setPicks(pickMap);
        setTiebreaker(data.tiebreaker?.total_goals?.toString() ?? "");

        if (settingsRes.ok) {
          setLocked(settingsData.locks.knockoutStageLocked);
          setPublished(
            Boolean(
              data.locks?.knockoutBracketPublished ||
                settingsData.locks.knockoutBracketPublished,
            ),
          );
          setDeadline(settingsData.locks.knockoutDeadline);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const savePick = useCallback(
    async (matchId: string, winner: string) => {
      if (locked) return;
      setSaveState("saving");
      try {
        const response = await fetch("/api/picks/knockout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, pickedWinner: winner }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Save failed");
        }
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [locked],
  );

  const saveTiebreaker = useCallback(
    async (value: string) => {
      if (locked) return;
      const totalGoals = Number(value);
      if (!Number.isInteger(totalGoals) || totalGoals < 0) return;

      setSaveState("saving");
      try {
        const response = await fetch("/api/picks/knockout", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalGoals }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Save failed");
        }
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [locked],
  );

  function handlePick(matchId: string, winner: string) {
    setPicks((prev) => ({ ...prev, [matchId]: winner }));
    void savePick(matchId, winner);
  }

  function handleTiebreakerChange(value: string) {
    setTiebreaker(value);
    if (tiebreakerTimer.current) clearTimeout(tiebreakerTimer.current);
    tiebreakerTimer.current = setTimeout(() => {
      void saveTiebreaker(value);
    }, 500);
  }

  if (loading) {
    return <p className="text-zinc-500">Loading knockout bracket…</p>;
  }

  if (!published) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Knockout Bracket</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          The knockout bracket has not been published yet. Check back after the
          group stage ends.
        </p>
      </div>
    );
  }

  const pickedCount = validPickCount(matches, picks);
  const complete = pickedCount === matches.length && tiebreaker !== "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Knockout Bracket</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Pick the winner of all {matches.length} knockout matches.
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Deadline: {formatDeadlineET(deadline)} ET
          </p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      {locked && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          Knockout picks are locked.
        </div>
      )}

      <p className="text-sm text-zinc-500">
        {pickedCount} of {matches.length} matches picked
        {!tiebreaker && " · Tiebreaker required"}
        {complete && " · Bracket complete"}
      </p>

      <Bracket
        matches={matches}
        picks={picks}
        locked={locked}
        onPick={handlePick}
      />

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-lg font-semibold">Tiebreaker</h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          Predict the total number of goals scored across all knockout matches
          (penalty shootouts excluded).
        </p>
        <input
          type="number"
          min={0}
          value={tiebreaker}
          disabled={locked}
          onChange={(e) => handleTiebreakerChange(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Total goals"
        />
      </section>
    </div>
  );
}
