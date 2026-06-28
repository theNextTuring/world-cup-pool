"use client";

import { Fragment, useState } from "react";
import { TeamLabel } from "@/components/TeamLabel";
import { participantName } from "@/lib/bracket";
import { GROUP_CODES } from "@/lib/teams";

type GroupPrediction = {
  group_code: string;
  ranks: [string, string, string, string];
  points?: number;
  actualRanks?: [string, string, string, string];
};

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
  groupMaxPoints: number;
  knockoutMaxPoints: number;
  totalMaxPoints: number;
  groupPredictions?: GroupPrediction[];
  knockoutPredictions?: KnockoutPrediction[];
};

type KnockoutRound = "r32" | "r16" | "qf" | "sf" | "final";

type KnockoutPrediction = {
  matchId: string;
  round: KnockoutRound;
  matchNumber: number;
  pickedWinner: string | null;
  options: {
    slot: string;
    slotLabel: string | null;
    value: string | null;
  }[];
};

const KNOCKOUT_ROUNDS: { round: KnockoutRound; label: string }[] = [
  { round: "r32", label: "Round of 32" },
  { round: "r16", label: "Round of 16" },
  { round: "qf", label: "Quarterfinals" },
  { round: "sf", label: "Semifinals" },
  { round: "final", label: "Final" },
];

export function LeaderboardTable({
  entries,
  actualTotalGoals,
  scoresVisible,
  knockoutPicksVisible,
  knockoutPublished,
}: {
  entries: Entry[];
  actualTotalGoals: number | null;
  scoresVisible: boolean;
  knockoutPicksVisible: boolean;
  knockoutPublished: boolean;
}) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  if (!entries.length) {
    return (
      <p className="text-zinc-500">No entries yet. Be the first to join!</p>
    );
  }

  function statusBadge(complete: boolean, label: string) {
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          complete
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        }`}
      >
        {label}
      </span>
    );
  }

  function formatJoinedDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  function groupPredictionMap(entry: Entry) {
    return Object.fromEntries(
      (entry.groupPredictions ?? []).map((pick) => [pick.group_code, pick]),
    ) as Record<string, GroupPrediction | undefined>;
  }

  function participantLabel(option: KnockoutPrediction["options"][number]) {
    if (option.value) return <TeamLabel slug={option.value} flagSize={16} />;
    return (
      <span className="text-zinc-500">
        {option.slotLabel ?? participantName(option.slot)}
      </span>
    );
  }

  function scoreFraction(points: number, maxPoints: number) {
    return `${points}/${maxPoints}`;
  }

  const canInspectPicks = scoresVisible || knockoutPicksVisible;
  const columnCount = scoresVisible ? 9 : 6;

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-3">{scoresVisible ? "Rank" : "#"}</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3">Group Picks</th>
            <th className="px-4 py-3">Complete Bracket</th>
            {scoresVisible && (
              <>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Knockout</th>
              </>
            )}
            <th className="px-4 py-3">Tiebreaker</th>
            {scoresVisible && <th className="px-4 py-3">Max Remaining</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const expanded = openUserId === entry.userId;
            const predictionsByGroup = groupPredictionMap(entry);

            return (
              <Fragment key={entry.userId}>
                <tr className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3 font-semibold">{entry.rank}</td>
                  <td className="px-4 py-3">
                    {canInspectPicks ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenUserId(expanded ? null : entry.userId)
                        }
                        className="text-left"
                        aria-expanded={expanded}
                      >
                        <span className="block font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300">
                          {entry.firstName} {entry.lastName}
                        </span>
                        <span className="block text-xs text-zinc-500">
                          {expanded ? "Hide picks" : "View picks"}
                        </span>
                      </button>
                    ) : (
                      <div className="font-medium">
                        {entry.firstName} {entry.lastName}
                      </div>
                    )}
                    <div className="text-xs text-zinc-500">
                      {entry.entryName} - joined {formatJoinedDate(entry.joinedAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {statusBadge(
                        entry.groupsComplete,
                        entry.groupsComplete ? "Complete" : "Incomplete",
                      )}
                      <div className="text-xs text-zinc-500">
                        {entry.groupSavedCount}/12 groups saved
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {knockoutPublished ? (
                      <div className="space-y-1">
                        {statusBadge(
                          entry.knockoutComplete,
                          entry.knockoutComplete ? "Complete" : "Incomplete",
                        )}
                        <div className="text-xs text-zinc-500">
                          {entry.knockoutPickCount}/{entry.knockoutRequiredCount}{" "}
                          matches
                          {!entry.tiebreakerComplete && " - tiebreaker needed"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">Not open yet</span>
                    )}
                  </td>
                  {scoresVisible && (
                    <>
                      <td className="px-4 py-3 font-semibold">
                        {scoreFraction(entry.totalPoints, entry.totalMaxPoints)}
                      </td>
                      <td className="px-4 py-3">
                        {scoreFraction(entry.groupPoints, entry.groupMaxPoints)}
                      </td>
                      <td className="px-4 py-3">
                        {scoreFraction(
                          entry.knockoutPoints,
                          entry.knockoutMaxPoints,
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    {entry.tiebreaker ?? "-"}
                    {actualTotalGoals !== null && entry.tiebreaker !== null && (
                      <span className="ml-1 text-xs text-zinc-500">
                        (off by {Math.abs(entry.tiebreaker - actualTotalGoals)})
                      </span>
                    )}
                  </td>
                  {scoresVisible && (
                    <td className="px-4 py-3">
                      <span className="block">{entry.maxRemaining} left</span>
                      <span className="block text-xs text-zinc-500">
                        {scoreFraction(
                          entry.totalPoints + entry.maxRemaining,
                          entry.totalMaxPoints,
                        )}{" "}
                        max
                      </span>
                    </td>
                  )}
                </tr>
                {canInspectPicks && expanded && (
                  <tr className="border-t border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <td colSpan={columnCount} className="px-4 py-4">
                      <div className="space-y-5">
                        {scoresVisible && (
                          <section>
                            <h3 className="mb-3 text-sm font-semibold">
                              Group Picks
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {GROUP_CODES.map((groupCode) => {
                                const prediction = predictionsByGroup[groupCode];
                                const ranks = prediction?.ranks;

                                return (
                                  <div
                                    key={groupCode}
                                    className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                                  >
                                    <p className="mb-2 text-sm font-semibold">
                                      Group {groupCode}
                                      {prediction?.points !== undefined && (
                                        <span className="ml-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                          {prediction.points} pts
                                        </span>
                                      )}
                                    </p>
                                    {ranks ? (
                                      <div className="space-y-3">
                                        <ol className="space-y-1 text-sm">
                                          {ranks.map((slug, index) => (
                                            <li
                                              key={slug}
                                              className="flex items-center gap-2"
                                            >
                                              <span className="w-5 shrink-0 text-xs font-semibold text-zinc-500">
                                                {index + 1}
                                              </span>
                                              <TeamLabel slug={slug} flagSize={18} />
                                            </li>
                                          ))}
                                        </ol>
                                        {prediction.actualRanks && (
                                          <div className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
                                            <p className="mb-1 text-xs font-medium text-zinc-500">
                                              Actual
                                            </p>
                                            <ol className="space-y-1 text-xs">
                                              {prediction.actualRanks.map(
                                                (slug, index) => (
                                                  <li
                                                    key={slug}
                                                    className="flex items-center gap-2"
                                                  >
                                                    <span className="w-5 shrink-0 font-semibold text-zinc-500">
                                                      {index + 1}
                                                    </span>
                                                    <TeamLabel
                                                      slug={slug}
                                                      flagSize={16}
                                                    />
                                                  </li>
                                                ),
                                              )}
                                            </ol>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-zinc-500">
                                        Not saved
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        )}

                        {knockoutPicksVisible && (
                          <section>
                            <h3 className="mb-3 text-sm font-semibold">
                              Knockout Bracket
                            </h3>
                            <div className="grid gap-3 lg:grid-cols-5">
                              {KNOCKOUT_ROUNDS.map(({ round, label }) => {
                                const roundPicks = (
                                  entry.knockoutPredictions ?? []
                                ).filter((pick) => pick.round === round);

                                return (
                                  <div key={round} className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                      {label}
                                    </p>
                                    {roundPicks.map((pick) => (
                                      <div
                                        key={pick.matchId}
                                        className="rounded-xl border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                                      >
                                        <p className="mb-2 font-semibold text-zinc-500">
                                          Match {pick.matchNumber}
                                        </p>
                                        <div className="space-y-1">
                                          {pick.options.map((option) => (
                                            <div
                                              key={option.slot}
                                              className={`rounded-lg border px-2 py-1.5 ${
                                                pick.pickedWinner &&
                                                option.value === pick.pickedWinner
                                                  ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                                                  : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                                              }`}
                                            >
                                              {participantLabel(option)}
                                              {option.slotLabel && option.value && (
                                                <span className="ml-1 text-[11px] font-normal text-zinc-400">
                                                  {option.slotLabel}
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {actualTotalGoals !== null && (
        <p className="border-t border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800">
          Actual total knockout goals: {actualTotalGoals}
        </p>
      )}
    </div>
  );
}
