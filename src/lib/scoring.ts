import type {
  AppSettings,
  GroupPick,
  GroupStanding,
  KnockoutMatch,
  KnockoutPick,
} from "./supabase";
import { validPickCount, winnerSlotMatchNumber } from "./bracket";

export const GROUP_POINTS = [1, 1, 1, 1] as const;

export const KNOCKOUT_ROUND_POINTS: Record<
  KnockoutMatch["round"],
  number
> = {
  r32: 1,
  r16: 2,
  qf: 3,
  sf: 5,
  final: 8,
};

export type GroupScoring = [number, number, number, number];

export type KnockoutScoring = Record<KnockoutMatch["round"], number>;

export type ScoringConfig = {
  groupPoints: GroupScoring;
  knockoutPoints: KnockoutScoring;
};

export const DEFAULT_SCORING: ScoringConfig = {
  groupPoints: [...GROUP_POINTS],
  knockoutPoints: { ...KNOCKOUT_ROUND_POINTS },
};

const KNOCKOUT_MATCH_COUNTS: Record<KnockoutMatch["round"], number> = {
  r32: 16,
  r16: 8,
  qf: 4,
  sf: 2,
  final: 1,
};

function validPointValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

export function scoringFromSettings(settings: AppSettings): ScoringConfig {
  return {
    groupPoints: [
      validPointValue(settings.group_rank1_points, GROUP_POINTS[0]),
      validPointValue(settings.group_rank2_points, GROUP_POINTS[1]),
      validPointValue(settings.group_rank3_points, GROUP_POINTS[2]),
      validPointValue(settings.group_rank4_points, GROUP_POINTS[3]),
    ],
    knockoutPoints: {
      r32: validPointValue(settings.knockout_r32_points, KNOCKOUT_ROUND_POINTS.r32),
      r16: validPointValue(settings.knockout_r16_points, KNOCKOUT_ROUND_POINTS.r16),
      qf: validPointValue(settings.knockout_qf_points, KNOCKOUT_ROUND_POINTS.qf),
      sf: validPointValue(settings.knockout_sf_points, KNOCKOUT_ROUND_POINTS.sf),
      final: validPointValue(
        settings.knockout_final_points,
        KNOCKOUT_ROUND_POINTS.final,
      ),
    },
  };
}

export function maxGroupPoints(scoring: ScoringConfig): number {
  return scoring.groupPoints.reduce((total, points) => total + points, 0) * 12;
}

export function maxKnockoutPoints(scoring: ScoringConfig): number {
  return Object.entries(KNOCKOUT_MATCH_COUNTS).reduce(
    (total, [round, count]) =>
      total + scoring.knockoutPoints[round as KnockoutMatch["round"]] * count,
    0,
  );
}

export function maxTotalPoints(scoring: ScoringConfig): number {
  return maxGroupPoints(scoring) + maxKnockoutPoints(scoring);
}

export const MAX_GROUP_POINTS = maxGroupPoints(DEFAULT_SCORING);
export const MAX_KNOCKOUT_POINTS = maxKnockoutPoints(DEFAULT_SCORING);
export const MAX_TOTAL_POINTS = maxTotalPoints(DEFAULT_SCORING);

export type GroupPickRanking = {
  group_code: string;
  ranks: [string, string, string, string];
  points?: number;
  actualRanks?: [string, string, string, string];
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
  scoring: ScoringConfig = DEFAULT_SCORING,
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
        total += scoring.groupPoints[i];
      }
    }
  }
  return total;
}

export function scoreKnockoutPicks(
  picks: KnockoutPick[],
  matches: KnockoutMatch[],
  scoring: ScoringConfig = DEFAULT_SCORING,
): number {
  const matchById = Object.fromEntries(matches.map((m) => [m.id, m]));
  let total = 0;

  for (const pick of picks) {
    const match = matchById[pick.match_id];
    if (!match?.winner) continue;
    if (pick.picked_winner === match.winner) {
      total += scoring.knockoutPoints[match.round];
    }
  }

  return total;
}

export function computeMaxRemainingKnockoutPoints(
  picks: KnockoutPick[],
  matches: KnockoutMatch[],
  scoring: ScoringConfig = DEFAULT_SCORING,
): number {
  const pickByMatch = Object.fromEntries(
    picks.map((p) => [p.match_id, p.picked_winner]),
  );
  const matchByNumber = new Map(
    matches.map((match) => [match.match_number, match]),
  );

  let remaining = 0;
  for (const match of matches) {
    if (match.winner) continue;
    const picked = pickByMatch[match.id];
    if (
      picked &&
      teamCanStillReachMatch(picked, match, pickByMatch, matchByNumber)
    ) {
      remaining += scoring.knockoutPoints[match.round];
    }
  }
  return remaining;
}

function teamCanStillReachMatch(
  team: string,
  match: KnockoutMatch,
  pickByMatch: Record<string, string>,
  matchByNumber: Map<number, KnockoutMatch>,
): boolean {
  return (
    teamCanComeFromSlot(team, match.team_a, pickByMatch, matchByNumber) ||
    teamCanComeFromSlot(team, match.team_b, pickByMatch, matchByNumber)
  );
}

function teamCanComeFromSlot(
  team: string,
  slot: string,
  pickByMatch: Record<string, string>,
  matchByNumber: Map<number, KnockoutMatch>,
): boolean {
  const sourceMatchNumber = winnerSlotMatchNumber(slot);
  if (sourceMatchNumber === null) {
    return slot === team;
  }

  const sourceMatch = matchByNumber.get(sourceMatchNumber);
  if (!sourceMatch) return false;

  if (sourceMatch.winner) {
    return sourceMatch.winner === team;
  }

  const pickedSourceWinner = pickByMatch[sourceMatch.id];
  return (
    pickedSourceWinner === team &&
    teamCanStillReachMatch(team, sourceMatch, pickByMatch, matchByNumber)
  );
}

export function computeMaxRemainingGroupPoints(
  picks: GroupPickRanking[],
  standings: GroupStanding[],
  scoring: ScoringConfig = DEFAULT_SCORING,
): number {
  const standingByGroup = Object.fromEntries(
    standings.map((s) => [s.group_code, standingToRanks(s)]),
  );
  const pickByGroup = Object.fromEntries(
    picks.map((p) => [p.group_code, p.ranks]),
  );

  let remaining = 0;
  const perGroupMax = scoring.groupPoints.reduce(
    (total, points) => total + points,
    0,
  );
  for (const code of "ABCDEFGHIJKL") {
    const actual = standingByGroup[code];
    if (!actual) {
      remaining += perGroupMax;
      continue;
    }
    const pick = pickByGroup[code];
    if (!pick) continue;
    for (let i = 0; i < 4; i++) {
      if (pick[i] !== actual[i]) {
        remaining += scoring.groupPoints[i];
      }
    }
  }
  return remaining;
}

export type LeaderboardEntry = {
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
  groupPoints: number;
  knockoutPoints: number;
  totalPoints: number;
  tiebreaker: number | null;
  tiebreakerDistance: number | null;
  maxRemaining: number;
  groupMaxPoints: number;
  knockoutMaxPoints: number;
  totalMaxPoints: number;
  groupPredictions?: GroupPickRanking[];
  knockoutPredictions?: KnockoutPrediction[];
};

export type KnockoutPredictionOption = {
  slot: string;
  slotLabel: string | null;
  value: string | null;
};

export type KnockoutPrediction = {
  matchId: string;
  round: KnockoutMatch["round"];
  matchNumber: number;
  pickedWinner: string | null;
  options: [KnockoutPredictionOption, KnockoutPredictionOption];
};

export function countValidKnockoutPicks(
  picks: KnockoutPick[],
  matches: KnockoutMatch[],
): number {
  const selections = Object.fromEntries(
    picks.map((pick) => [pick.match_id, pick.picked_winner]),
  );
  return validPickCount(matches, selections);
}

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
