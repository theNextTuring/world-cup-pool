"use client";

import { useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { formatDeadlineET } from "@/lib/dates";

type Entry = {
  rank: number;
  entryName: string;
  totalPoints: number;
  groupPoints: number;
  knockoutPoints: number;
  tiebreaker: number | null;
  maxRemaining: number;
};

export default function LeaderboardPage() {
  const [visible, setVisible] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [actualGoals, setActualGoals] = useState<number | null>(null);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [boardRes, settingsRes] = await Promise.all([
          fetch("/api/leaderboard"),
          fetch("/api/settings"),
        ]);
        const settingsData = await settingsRes.json();
        if (settingsRes.ok) {
          setDeadline(settingsData.locks.groupDeadline);
        }

        if (boardRes.status === 403) {
          setVisible(false);
          setMessage("Leaderboard will appear after the group stage deadline.");
          return;
        }

        const boardData = await boardRes.json();
        if (!boardRes.ok) {
          setMessage(boardData.error ?? "Unable to load leaderboard");
          return;
        }

        setVisible(true);
        setEntries(boardData.entries ?? []);
        setActualGoals(boardData.actualTotalKnockoutGoals ?? null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <p className="text-zinc-500">Loading leaderboard…</p>;
  }

  if (!visible) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{message}</p>
        {deadline && (
          <p className="text-sm text-zinc-500">
            Group deadline: {formatDeadlineET(deadline)} ET
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sorted by total points, then tiebreaker accuracy.
        </p>
      </div>
      <LeaderboardTable
        entries={entries}
        actualTotalGoals={actualGoals}
      />
    </div>
  );
}
