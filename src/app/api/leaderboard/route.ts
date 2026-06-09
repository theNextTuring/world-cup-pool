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

export async function GET() {
  try {
    const supabase = createServiceClient();
    const settings = await fetchSettings(supabase);
    const locks = getEffectiveLocks(settings);

    if (!locks.groupStageLocked) {
      return NextResponse.json(
        { error: "Leaderboard hidden until group stage deadline", visible: false },
        { status: 403 },
      );
    }

    const [
      usersRes,
      groupPicksRes,
      knockoutPicksRes,
      standingsRes,
      matchesRes,
      tiebreakersRes,
    ] = await Promise.all([
      supabase.from("users").select("id, entry_name"),
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

      const groupPoints = scoreGroupPicks(userGroupPicks, standings);
      const knockoutPoints = scoreKnockoutPicks(userKnockoutPicks, matches);
      const maxRemaining =
        computeMaxRemainingGroupPoints(userGroupPicks, standings) +
        computeMaxRemainingKnockoutPoints(userKnockoutPicks, matches);

      return {
        userId: user.id,
        entryName: user.entry_name,
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
