import { NextResponse } from "next/server";
import { fetchSettings, getEffectiveLocks } from "@/lib/locks";
import { participantOptionsForMatch } from "@/lib/bracket";
import {
  computeMaxRemainingGroupPoints,
  computeMaxRemainingKnockoutPoints,
  countValidKnockoutPicks,
  groupPickToRanking,
  maxGroupPoints,
  maxKnockoutPoints,
  maxTotalPoints,
  scoreGroupPicks,
  scoreKnockoutPicks,
  scoringFromSettings,
  sortLeaderboard,
  standingToRanks,
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
    const scoring = scoringFromSettings(settings);
    const groupMaxPoints = maxGroupPoints(scoring);
    const knockoutMaxPoints = maxKnockoutPoints(scoring);
    const totalMaxPoints = maxTotalPoints(scoring);
    const scoresVisible = locks.groupStageLocked;
    const knockoutPicksVisible =
      locks.knockoutStageLocked && locks.knockoutBracketPublished;

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
    const standingsByGroup = Object.fromEntries(
      standings.map((standing) => [standing.group_code, standing]),
    );

    const entries: LeaderboardEntry[] = users.map((user) => {
      const userGroupPicks = groupPicks
        .filter((p) => p.user_id === user.id)
        .map(groupPickToRanking);
      const userKnockoutPicks = knockoutPicks.filter(
        (p) => p.user_id === user.id,
      );
      const knockoutSelections = Object.fromEntries(
        userKnockoutPicks.map((pick) => [pick.match_id, pick.picked_winner]),
      );
      const tiebreaker =
        tiebreakers.find((t) => t.user_id === user.id)?.total_goals ?? 0;
      const groupSavedCount = userGroupPicks.length;
      const groupsComplete = groupSavedCount === GROUP_CODES.length;
      const knockoutPickCount = countValidKnockoutPicks(
        userKnockoutPicks,
        matches,
      );
      const knockoutRequiredCount = matches.length;
      const tiebreakerComplete = true;
      const knockoutComplete =
        locks.knockoutBracketPublished &&
        knockoutRequiredCount > 0 &&
        knockoutPickCount === knockoutRequiredCount &&
        tiebreakerComplete;

      const groupPoints = scoreGroupPicks(userGroupPicks, standings, scoring);
      const knockoutPoints = scoreKnockoutPicks(
        userKnockoutPicks,
        matches,
        scoring,
      );
      const maxRemaining =
        computeMaxRemainingGroupPoints(userGroupPicks, standings, scoring) +
        computeMaxRemainingKnockoutPoints(
          userKnockoutPicks,
          matches,
          scoring,
        );

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
        groupMaxPoints,
        knockoutMaxPoints,
        totalMaxPoints,
        groupPredictions: scoresVisible
          ? userGroupPicks.map((pick) => {
              const standing = standingsByGroup[pick.group_code];
              return {
                ...pick,
                points: standing
                  ? scoreGroupPicks([pick], [standing], scoring)
                  : 0,
                actualRanks: standing ? standingToRanks(standing) : undefined,
              };
            })
          : undefined,
        knockoutPredictions: knockoutPicksVisible
          ? matches
              .slice()
              .sort((a, b) => a.match_number - b.match_number)
              .map((match) => {
                const options = participantOptionsForMatch(
                  matches,
                  knockoutSelections,
                  match,
                );

                return {
                  matchId: match.id,
                  round: match.round,
                  matchNumber: match.match_number,
                  pickedWinner: knockoutSelections[match.id] ?? null,
                  options: [options[0], options[1]],
                };
              })
          : undefined,
      };
    });

    const sorted = sortLeaderboard(entries, actualGoals).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return NextResponse.json({
      visible: true,
      scoresVisible,
      knockoutPicksVisible,
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
