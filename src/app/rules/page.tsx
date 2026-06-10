"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDeadlineET } from "@/lib/dates";
import {
  DEFAULT_SCORING,
  maxGroupPoints,
  maxKnockoutPoints,
  maxTotalPoints,
  scoringFromSettings,
  type ScoringConfig,
} from "@/lib/scoring";
import type { AppSettings } from "@/lib/supabase";

const FALLBACK_GROUP_DEADLINE = "2026-06-11T19:00:00Z";

const KNOCKOUT_ROWS = [
  { round: "r32", label: "Round of 32", matches: 16 },
  { round: "r16", label: "Round of 16", matches: 8 },
  { round: "qf", label: "Quarterfinals", matches: 4 },
  { round: "sf", label: "Semifinals", matches: 2 },
  { round: "final", label: "Final", matches: 1 },
] as const;

function PointRow({
  label,
  points,
  detail,
}: {
  label: string;
  points: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-200 py-3 last:border-0 dark:border-zinc-800">
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
        {detail && <p className="text-xs text-zinc-500">{detail}</p>}
      </div>
      <span className="shrink-0 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        {points}
      </span>
    </div>
  );
}

export default function RulesPage() {
  const [scoring, setScoring] = useState<ScoringConfig>(DEFAULT_SCORING);
  const [groupDeadline, setGroupDeadline] = useState(FALLBACK_GROUP_DEADLINE);
  const [knockoutDeadline, setKnockoutDeadline] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const data = (await response.json()) as { settings?: AppSettings };
        if (cancelled || !data.settings) return;
        setScoring(scoringFromSettings(data.settings));
        setGroupDeadline(data.settings.group_deadline);
        setKnockoutDeadline(data.settings.knockout_deadline);
      } catch {
        // Keep the default scoring copy if settings are unavailable.
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupTotal = maxGroupPoints(scoring);
  const knockoutTotal = maxKnockoutPoints(scoring);
  const totalPoints = maxTotalPoints(scoring);
  const perGroupMax = scoring.groupPoints.reduce(
    (total, points) => total + points,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          World Cup Pool 2026
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Rules</h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Entry is $5. Send payment on Venmo to{" "}
          <strong>@lockofthecentury</strong>. Make your picks before each
          deadline; locked picks are final.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/groups"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Make picks
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Leaderboard
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">{totalPoints}</p>
          <p className="text-sm text-zinc-500">Max points</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">12</p>
          <p className="text-sm text-zinc-500">Groups</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">31</p>
          <p className="text-sm text-zinc-500">Knockout matches</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Group scoring</h2>
          <div className="mt-3">
            <PointRow
              label="Correct 1st place"
              points={`${scoring.groupPoints[0]} pts`}
            />
            <PointRow
              label="Correct 2nd place"
              points={`${scoring.groupPoints[1]} pts`}
            />
            <PointRow
              label="Correct 3rd place"
              points={`${scoring.groupPoints[2]} pts`}
            />
            <PointRow
              label="Correct 4th place"
              points={`${scoring.groupPoints[3]} pts`}
            />
            <PointRow
              label="Per group"
              points={`${perGroupMax} pts`}
              detail="Rank all four teams in a group"
            />
            <PointRow label="Group stage max" points={`${groupTotal} pts`} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Knockout scoring</h2>
          <div className="mt-3">
            {KNOCKOUT_ROWS.map((row) => (
              <PointRow
                key={row.round}
                label={row.label}
                points={`${scoring.knockoutPoints[row.round]} pts`}
                detail={`${row.matches} match${row.matches === 1 ? "" : "es"}`}
              />
            ))}
            <PointRow label="Knockout max" points={`${knockoutTotal} pts`} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5 text-sm leading-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Need to know</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-600 dark:text-zinc-400">
          <li>Save all 12 group rankings before {formatDeadlineET(groupDeadline)} ET.</li>
          <li>
            Knockout picks open after the bracket is published. Deadline:{" "}
            {knockoutDeadline ? `${formatDeadlineET(knockoutDeadline)} ET` : "TBD"}.
          </li>
          <li>
            Tiebreaker is total knockout goals. Penalty shootout goals do not
            count.
          </li>
          <li>
            Leaderboard points appear after group picks lock. Ties go to the
            closest tiebreaker.
          </li>
        </ul>
      </section>
    </div>
  );
}
