import { NextResponse } from "next/server";
import { fetchSettings, getEffectiveLocks } from "@/lib/locks";
import {
  computeMaxRemainingGroupPoints,
  computeMaxRemainingKnockoutPoints,
  groupPickToRanking,
  scoreGroupPicks,
  scoreKnockoutPicks,
  sortLeaderboard,
  tiebreakerDistance,
  type LeaderboardEntry,
} from "@/lib/scoring";
import { createServiceClient } from "@/lib/supabase";
import { GROUP_CODES } from "@/lib/teams";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const settings = await fetchSettings(supabase);
    const locks = getEffectiveLocks(settings);
    const scoresVisible = locks.groupStageLocked;

    const [
      usersRes,
      groupPicksRes,
      knockoutPicksRes,
      standingsRes,
      matchesRes,
      tiebreakersRes,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("id, first_name, last_name, entry_name, created_at"),
      supabase.from("group_picks").select("*"),
      supabase.from("knockout_picks").select("*"),
      supabase.from("group_standings").select("*"),
      supabase.from("knockout_matches").select("*"),
      supabase.from("tiebreaker_predictions").select("*"),
    ]);

    const users = usersRes.data ?? [];
    const groupPicks = groupPicksRes.data ?? [];
    const knockoutPicks = knockoutPicksRes.data ?? [];
    const standings = standingsRes.data ?? [];
    const matches = matchesRes.data ?? [];
    const tiebreakers = tiebreakersRes.data ?? [];
    const actualGoals = locks.actualTotalKnockoutGoals;

    const entries: LeaderboardEntry[] = users.map((user) => {
      const userGroupPicks = groupPicks
        .filter((p) => p.user_id === user.id)
        .map(groupPickToRanking);
      const userKnockoutPicks = knockoutPicks.filter(
        (p) => p.user_id === user.id,
      );
      const tiebreaker =
        tiebreakers.find((t) => t.user_id === user.id)?.total_goals ?? null;
      const groupSavedCount = userGroupPicks.length;
      const groupsComplete = groupSavedCount === GROUP_CODES.length;
      const knockoutPickCount = userKnockoutPicks.length;
      const knockoutRequiredCount = matches.length;
      const tiebreakerComplete = tiebreaker !== null;
      const knockoutComplete =
        locks.knockoutBracketPublished &&
        knockoutRequiredCount > 0 &&
        knockoutPickCount === knockoutRequiredCount &&
        tiebreakerComplete;

      const groupPoints = scoreGroupPicks(userGroupPicks, standings);
      const knockoutPoints = scoreKnockoutPicks(userKnockoutPicks, matches);
      const maxRemaining =
        computeMaxRemainingGroupPoints(userGroupPicks, standings) +
        computeMaxRemainingKnockoutPoints(userKnockoutPicks, matches);

      return {
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        entryName: user.entry_name,
        joinedAt: user.created_at,
        groupSavedCount,
        groupsComplete,
        knockoutPickCount,
        knockoutRequiredCount,
        tiebreakerComplete,
        knockoutComplete,
        groupPoints,
        knockoutPoints,
        totalPoints: groupPoints + knockoutPoints,
        tiebreaker,
        tiebreakerDistance: tiebreakerDistance(tiebreaker, actualGoals),
        maxRemaining,
      };
    });

    const sorted = sortLeaderboard(entries, actualGoals).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return NextResponse.json({
      visible: true,
      scoresVisible,
      knockoutBracketPublished: locks.knockoutBracketPublished,
      actualTotalKnockoutGoals: actualGoals,
      entries: sorted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
