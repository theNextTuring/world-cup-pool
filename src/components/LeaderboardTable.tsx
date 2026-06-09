type Entry = {
  rank: number;
  entryName: string;
  totalPoints: number;
  groupPoints: number;
  knockoutPoints: number;
  tiebreaker: number | null;
  maxRemaining: number;
};

export function LeaderboardTable({
  entries,
  actualTotalGoals,
}: {
  entries: Entry[];
  actualTotalGoals: number | null;
}) {
  if (!entries.length) {
    return (
      <p className="text-zinc-500">No entries yet. Be the first to join!</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Entry</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Group</th>
            <th className="px-4 py-3">Knockout</th>
            <th className="px-4 py-3">Tiebreaker</th>
            <th className="px-4 py-3">Max Remaining</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.entryName}
              className="border-t border-zinc-200 dark:border-zinc-800"
            >
              <td className="px-4 py-3 font-semibold">{entry.rank}</td>
              <td className="px-4 py-3">{entry.entryName}</td>
              <td className="px-4 py-3 font-semibold">{entry.totalPoints}</td>
              <td className="px-4 py-3">{entry.groupPoints}</td>
              <td className="px-4 py-3">{entry.knockoutPoints}</td>
              <td className="px-4 py-3">
                {entry.tiebreaker ?? "—"}
                {actualTotalGoals !== null && entry.tiebreaker !== null && (
                  <span className="ml-1 text-xs text-zinc-500">
                    (off by {Math.abs(entry.tiebreaker - actualTotalGoals)})
                  </span>
                )}
              </td>
              <td className="px-4 py-3">{entry.maxRemaining}</td>
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
