import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminAuthenticated } from "@/lib/admin";
import {
  isWinnerSlot,
  matchWinnerMap,
  participantOptionsForMatch,
} from "@/lib/bracket";
import { ensureOfficialKnockoutBracket } from "@/lib/officialBracket";
import type { KnockoutRound } from "@/lib/supabase";
import { createServiceClient } from "@/lib/supabase";

const VALID_ROUNDS: KnockoutRound[] = ["r32", "r16", "qf", "sf", "final"];
const ROUND_REQUIREMENTS: Record<KnockoutRound, number> = {
  r32: 16,
  r16: 8,
  qf: 4,
  sf: 2,
  final: 1,
};

export async function GET() {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const supabase = createServiceClient();
    const data = await ensureOfficialKnockoutBracket(supabase);

    return NextResponse.json({ matches: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const body = await request.json();
    const matches = Array.isArray(body.matches) ? body.matches : [];

    if (!matches.length) {
      return NextResponse.json({ error: "No matches provided" }, { status: 400 });
    }

    const expectedTotal = Object.values(ROUND_REQUIREMENTS).reduce(
      (total, count) => total + count,
      0,
    );

    if (matches.length !== expectedTotal) {
      return NextResponse.json(
        { error: `A complete bracket must have ${expectedTotal} matches` },
        { status: 400 },
      );
    }

    const rows = [];
    for (const [index, match] of matches.entries() as IterableIterator<
      [number, Record<string, unknown>]
    >) {
      const round = String(match.round ?? "") as KnockoutRound;
      if (!VALID_ROUNDS.includes(round)) {
        return NextResponse.json(
          { error: `Invalid round at index ${index}` },
          { status: 400 },
        );
      }
      const matchNumber = Number(match.matchNumber ?? index + 1);
      if (!Number.isInteger(matchNumber) || matchNumber < 1) {
        return NextResponse.json(
          { error: `Invalid match number at index ${index}` },
          { status: 400 },
        );
      }
      const teamA = String(match.teamA ?? "");
      const teamB = String(match.teamB ?? "");
      if (!teamA || !teamB || teamA === teamB) {
        return NextResponse.json(
          { error: `Invalid teams at index ${index}` },
          { status: 400 },
        );
      }
      if (round === "r32" && (isWinnerSlot(teamA) || isWinnerSlot(teamB))) {
        return NextResponse.json(
          { error: `Round of 32 teams must be actual teams at index ${index}` },
          { status: 400 },
        );
      }
      const winner = match.winner ? String(match.winner) : null;
      if (
        winner &&
        !isWinnerSlot(teamA) &&
        !isWinnerSlot(teamB) &&
        winner !== teamA &&
        winner !== teamB
      ) {
        return NextResponse.json(
          { error: `Invalid winner at index ${index}` },
          { status: 400 },
        );
      }
      rows.push({
        round,
        match_number: matchNumber,
        team_a: teamA,
        team_b: teamB,
        winner,
      });
    }

    for (const round of VALID_ROUNDS) {
      const roundRows = rows.filter((row) => row.round === round);
      const requiredCount = ROUND_REQUIREMENTS[round];
      if (roundRows.length !== requiredCount) {
        return NextResponse.json(
          {
            error: `${round.toUpperCase()} must have ${requiredCount} matches`,
          },
          { status: 400 },
        );
      }

      const matchNumbers = new Set(roundRows.map((row) => row.match_number));
      if (matchNumbers.size !== roundRows.length) {
        return NextResponse.json(
          { error: `${round.toUpperCase()} match numbers must be unique` },
          { status: 400 },
        );
      }
    }

    const allMatchNumbers = new Set(rows.map((row) => row.match_number));
    if (allMatchNumbers.size !== rows.length) {
      return NextResponse.json(
        { error: "Match numbers must be unique across the bracket" },
        { status: 400 },
      );
    }

    const draftMatches = rows.map((row) => ({
      id: `draft-${row.match_number}`,
      ...row,
    }));
    const draftWinners = matchWinnerMap(draftMatches);
    for (const match of draftMatches) {
      if (!match.winner) continue;
      const validWinners = participantOptionsForMatch(
        draftMatches,
        draftWinners,
        match,
      ).flatMap((option) => (option.value ? [option.value] : []));
      if (!validWinners.includes(match.winner)) {
        return NextResponse.json(
          { error: `Invalid winner for match ${match.match_number}` },
          { status: 400 },
        );
      }
    }

    const supabase = createServiceClient();
    const { error: deleteError } = await supabase
      .from("knockout_matches")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("knockout_matches")
      .insert(rows)
      .select("*");

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to save bracket" },
        { status: 500 },
      );
    }

    return NextResponse.json({ matches: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const body = await request.json();
    const matchId = String(body.matchId ?? "");
    const winner = body.winner === null ? null : String(body.winner ?? "");

    if (!matchId) {
      return NextResponse.json({ error: "matchId required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    if (winner) {
      const { data: matches } = await supabase
        .from("knockout_matches")
        .select("*")
        .order("match_number");
      const match = (matches ?? []).find((candidate) => candidate.id === matchId);

      if (!match) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }
      const options = participantOptionsForMatch(
        matches ?? [],
        matchWinnerMap(matches ?? []),
        match,
      );
      const validWinners = options.flatMap((option) =>
        option.value ? [option.value] : [],
      );
      if (!validWinners.includes(winner)) {
        return NextResponse.json({ error: "Invalid winner" }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from("knockout_matches")
      .update({ winner })
      .eq("id", matchId)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to update match" },
        { status: 500 },
      );
    }

    return NextResponse.json({ match: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
