import type { GroupPick, GroupStanding, KnockoutMatch, KnockoutPick } from "./supabase";

export const GROUP_POINTS = [3, 3, 2, 2] as const;

export const KNOCKOUT_ROUND_POINTS: Record<
  KnockoutMatch["round"],
  number
> = {
  r32: 2,
  r16: 3,
  qf: 5,
  sf: 7,
  final: 10,
};

export const MAX_GROUP_POINTS = 120;
export const MAX_KNOCKOUT_POINTS = 100;
export const MAX_TOTAL_POINTS = 220;

export type GroupPickRanking = {
  group_code: string;
  ranks: [string, string, string, string];
};

export function groupPickToRanking(pick: GroupPick): GroupPickRanking {
  return {
    group_code: pick.group_code,
    ranks: [pick.rank1_team, pick.rank2_team, pick.rank3_team, pick.rank4_team],
  };
}

export function standingToRanks(standing: GroupStanding): [string, string, string, string] {
  return [
    standing.rank1_team,
    standing.rank2_team,
    standing.rank3_team,
    standing.rank4_team,
  ];
}

export function scoreGroupPicks(
  picks: GroupPickRanking[],
  standings: GroupStanding[],
): number {
  const standingByGroup = Object.fromEntries(
    standings.map((s) => [s.group_code, standingToRanks(s)]),
  );

  let total = 0;
  for (const pick of picks) {
    const actual = standingByGroup[pick.group_code];
    if (!actual) continue;
    for (let i = 0; i < 4; i++) {
      if (pick.ranks[i] === actual[i]) {
        total += GROUP_POINTS[i];
      }
    }
  }
  return total;
}

export function scoreKnockoutPicks(
  picks: KnockoutPick[],
  matches: KnockoutMatch[],
): number {
  const matchById = Object.fromEntries(matches.map((m) => [m.id, m]));
  let total = 0;

  for (const pick of picks) {
    const match = matchById[pick.match_id];
    if (!match?.winner) continue;
    if (pick.picked_winner === match.winner) {
      total += KNOCKOUT_ROUND_POINTS[match.round];
    }
  }

  return total;
}

export function computeMaxRemainingKnockoutPoints(
  picks: KnockoutPick[],
  matches: KnockoutMatch[],
): number {
  const pickByMatch = Object.fromEntries(
    picks.map((p) => [p.match_id, p.picked_winner]),
  );

  let remaining = 0;
  for (const match of matches) {
    if (match.winner) continue;
    const picked = pickByMatch[match.id];
    if (!picked) {
      remaining += KNOCKOUT_ROUND_POINTS[match.round];
      continue;
    }
    const couldStillWin =
      picked === match.team_a || picked === match.team_b;
    if (couldStillWin) {
      remaining += KNOCKOUT_ROUND_POINTS[match.round];
    }
  }
  return remaining;
}

export function computeMaxRemainingGroupPoints(
  picks: GroupPickRanking[],
  standings: GroupStanding[],
): number {
  const standingByGroup = Object.fromEntries(
    standings.map((s) => [s.group_code, standingToRanks(s)]),
  );
  const pickByGroup = Object.fromEntries(
    picks.map((p) => [p.group_code, p.ranks]),
  );

  let remaining = 0;
  for (const code of "ABCDEFGHIJKL") {
    const actual = standingByGroup[code];
    if (!actual) {
      remaining += 10;
      continue;
    }
    const pick = pickByGroup[code];
    if (!pick) continue;
    for (let i = 0; i < 4; i++) {
      if (pick[i] !== actual[i]) {
        remaining += GROUP_POINTS[i];
      }
    }
  }
  return remaining;
}

export type LeaderboardEntry = {
  userId: string;
  entryName: string;
  groupPoints: number;
  knockoutPoints: number;
  totalPoints: number;
  tiebreaker: number | null;
  tiebreakerDistance: number | null;
  maxRemaining: number;
};

export function sortLeaderboard(
  entries: LeaderboardEntry[],
  actualTotalGoals: number | null,
): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (actualTotalGoals !== null) {
      const distA = a.tiebreakerDistance ?? Number.POSITIVE_INFINITY;
      const distB = b.tiebreakerDistance ?? Number.POSITIVE_INFINITY;
      if (distA !== distB) return distA - distB;
    }
    return a.entryName.localeCompare(b.entryName);
  });
}

export function tiebreakerDistance(
  predicted: number | null,
  actual: number | null,
): number | null {
  if (predicted === null || actual === null) return null;
  return Math.abs(predicted - actual);
}
