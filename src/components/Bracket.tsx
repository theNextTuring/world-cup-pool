"use client";

import type { KnockoutMatch } from "@/lib/supabase";
import { teamName } from "@/lib/teams";

const ROUND_LABELS: Record<KnockoutMatch["round"], string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarterfinals",
  sf: "Semifinals",
  final: "Final",
};

const ROUND_ORDER: KnockoutMatch["round"][] = [
  "r32",
  "r16",
  "qf",
  "sf",
  "final",
];

export function Bracket({
  matches,
  picks,
  locked,
  onPick,
}: {
  matches: KnockoutMatch[];
  picks: Record<string, string>;
  locked: boolean;
  onPick: (matchId: string, winner: string) => void;
}) {
  const byRound = ROUND_ORDER.map((round) => ({
    round,
    label: ROUND_LABELS[round],
    matches: matches
      .filter((m) => m.round === round)
      .sort((a, b) => a.match_number - b.match_number),
  }));

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {byRound.map(({ round, label, matches: roundMatches }) => (
          <div key={round} className="w-64 shrink-0">
            <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {label}
            </h3>
            <div className="flex flex-col gap-3">
              {roundMatches.map((match) => {
                const picked = picks[match.id];
                return (
                  <div
                    key={match.id}
                    className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <p className="mb-2 text-xs text-zinc-500">
                      Match {match.match_number}
                    </p>
                    {[match.team_a, match.team_b].map((slug) => {
                      const selected = picked === slug;
                      return (
                        <button
                          key={slug}
                          type="button"
                          disabled={locked}
                          onClick={() => onPick(match.id, slug)}
                          className={`mb-1 w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                            selected
                              ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                              : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-500"
                          } ${locked ? "cursor-default opacity-80" : "cursor-pointer"}`}
                        >
                          {teamName(slug)}
                          {match.winner === slug && (
                            <span className="ml-2 text-xs text-emerald-600">
                              (actual)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
