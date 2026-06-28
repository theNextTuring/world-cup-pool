"use client";

import { useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { formatDeadlineET } from "@/lib/dates";

type Entry = {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  entryName: string;
  joinedAt: string;
  groupSavedCount: number;
  groupsComplete: boolean;
  knockoutPickCount: number;
  knockoutRequiredCount: number;
  tiebreakerComplete: boolean;
  knockoutComplete: boolean;
  totalPoints: number;
  groupPoints: number;
  knockoutPoints: number;
  tiebreaker: number | null;
  maxRemaining: number;
  groupPredictions?: {
    group_code: string;
    ranks: [string, string, string, string];
  }[];
  knockoutPredictions?: {
    matchId: string;
    round: "r32" | "r16" | "qf" | "sf" | "final";
    matchNumber: number;
    pickedWinner: string | null;
    options: {
      slot: string;
      slotLabel: string | null;
      value: string | null;
    }[];
  }[];
};

export default function LeaderboardPage() {
  const [visible, setVisible] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [actualGoals, setActualGoals] = useState<number | null>(null);
  const [scoresVisible, setScoresVisible] = useState(false);
  const [knockoutPicksVisible, setKnockoutPicksVisible] = useState(false);
  const [knockoutPublished, setKnockoutPublished] = useState(false);
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

        const boardData = await boardRes.json();
        if (!boardRes.ok) {
          setMessage(boardData.error ?? "Unable to load leaderboard");
          return;
        }

        setVisible(true);
        setEntries(boardData.entries ?? []);
        setActualGoals(boardData.actualTotalKnockoutGoals ?? null);
        setScoresVisible(Boolean(boardData.scoresVisible));
        setKnockoutPicksVisible(Boolean(boardData.knockoutPicksVisible));
        setKnockoutPublished(Boolean(boardData.knockoutBracketPublished));
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
          See who has joined and whether their picks are complete.
          {scoresVisible
            ? " Scores are sorted by total points, then tiebreaker accuracy."
            : " Scores unlock after the group deadline."}
        </p>
      </div>
      <LeaderboardTable
        entries={entries}
        actualTotalGoals={actualGoals}
        scoresVisible={scoresVisible}
        knockoutPicksVisible={knockoutPicksVisible}
        knockoutPublished={knockoutPublished}
      />
    </div>
  );
}
