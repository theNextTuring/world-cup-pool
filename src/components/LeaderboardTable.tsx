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
};

export function LeaderboardTable({
  entries,
  actualTotalGoals,
  scoresVisible,
  knockoutPublished,
}: {
  entries: Entry[];
  actualTotalGoals: number | null;
  scoresVisible: boolean;
  knockoutPublished: boolean;
}) {
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
          {entries.map((entry) => (
            <tr
              key={entry.userId}
              className="border-t border-zinc-200 dark:border-zinc-800"
            >
              <td className="px-4 py-3 font-semibold">{entry.rank}</td>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {entry.firstName} {entry.lastName}
                </div>
                <div className="text-xs text-zinc-500">
                  {entry.entryName} · joined {formatJoinedDate(entry.joinedAt)}
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
                      {!entry.tiebreakerComplete && " · tiebreaker needed"}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500">Not open yet</span>
                )}
              </td>
              {scoresVisible && (
                <>
                  <td className="px-4 py-3 font-semibold">
                    {entry.totalPoints}
                  </td>
                  <td className="px-4 py-3">{entry.groupPoints}</td>
                  <td className="px-4 py-3">{entry.knockoutPoints}</td>
                </>
              )}
              <td className="px-4 py-3">
                {entry.tiebreaker ?? "—"}
                {actualTotalGoals !== null && entry.tiebreaker !== null && (
                  <span className="ml-1 text-xs text-zinc-500">
                    (off by {Math.abs(entry.tiebreaker - actualTotalGoals)})
                  </span>
                )}
              </td>
              {scoresVisible && (
                <td className="px-4 py-3">{entry.maxRemaining}</td>
              )}
            </tr>
          ))}
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
