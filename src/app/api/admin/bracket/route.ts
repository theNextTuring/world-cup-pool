import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminAuthenticated } from "@/lib/admin";
import type { KnockoutRound } from "@/lib/supabase";
import { createServiceClient } from "@/lib/supabase";

const VALID_ROUNDS: KnockoutRound[] = ["r32", "r16", "qf", "sf", "final"];

export async function GET() {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("knockout_matches")
      .select("*")
      .order("round")
      .order("match_number");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ matches: data ?? [] });
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

    const rows = matches.map((match: Record<string, unknown>, index: number) => {
      const round = String(match.round ?? "") as KnockoutRound;
      if (!VALID_ROUNDS.includes(round)) {
        throw new Error(`Invalid round at index ${index}`);
      }
      const teamA = String(match.teamA ?? "");
      const teamB = String(match.teamB ?? "");
      if (!teamA || !teamB || teamA === teamB) {
        throw new Error(`Invalid teams at index ${index}`);
      }
      return {
        round,
        match_number: Number(match.matchNumber ?? index + 1),
        team_a: teamA,
        team_b: teamB,
        winner: match.winner ? String(match.winner) : null,
      };
    });

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
      const { data: match } = await supabase
        .from("knockout_matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (!match) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }
      if (winner !== match.team_a && winner !== match.team_b) {
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
