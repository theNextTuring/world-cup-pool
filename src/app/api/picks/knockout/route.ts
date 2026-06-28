import { NextResponse } from "next/server";
import {
  isSelectionValid,
  participantOptionsForMatch,
} from "@/lib/bracket";
import { fetchSettings, getEffectiveLocks } from "@/lib/locks";
import { ensureOfficialKnockoutBracket } from "@/lib/officialBracket";
import { getSessionUserId, unauthorized } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const supabase = createServiceClient();
    const [picksRes, tiebreakerRes] = await Promise.all([
      supabase.from("knockout_picks").select("*").eq("user_id", userId),
      supabase
        .from("tiebreaker_predictions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    const matches = await ensureOfficialKnockoutBracket(supabase);
    const settings = await fetchSettings(supabase);

    const locks = getEffectiveLocks(settings);

    return NextResponse.json({
      picks: picksRes.data ?? [],
      tiebreaker: tiebreakerRes.data ?? null,
      matches,
      locks,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const matchId = String(body.matchId ?? "");
    const pickedWinner = String(body.pickedWinner ?? "");

    if (!matchId || !pickedWinner) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const settings = await fetchSettings(supabase);
    const locks = getEffectiveLocks(settings);

    if (!locks.knockoutBracketPublished) {
      return NextResponse.json(
        { error: "Knockout bracket not yet published" },
        { status: 403 },
      );
    }

    if (locks.knockoutStageLocked) {
      return NextResponse.json(
        { error: "Knockout picks are locked" },
        { status: 403 },
      );
    }

    const { data: matches } = await supabase
      .from("knockout_matches")
      .select("*")
      .order("match_number");

    const match = (matches ?? []).find((candidate) => candidate.id === matchId);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const { data: existingPicks } = await supabase
      .from("knockout_picks")
      .select("*")
      .eq("user_id", userId);
    const selections = Object.fromEntries(
      (existingPicks ?? []).map((pick) => [pick.match_id, pick.picked_winner]),
    );
    selections[matchId] = pickedWinner;

    const options = participantOptionsForMatch(matches ?? [], selections, match);
    if (!options.every((option) => option.value)) {
      return NextResponse.json(
        { error: "Pick the earlier source matches first" },
        { status: 400 },
      );
    }

    if (!isSelectionValid(matches ?? [], selections, match)) {
      return NextResponse.json({ error: "Invalid winner pick" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("knockout_picks")
      .upsert(
        {
          user_id: userId,
          match_id: matchId,
          picked_winner: pickedWinner,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,match_id" },
      )
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to save pick" },
        { status: 500 },
      );
    }

    return NextResponse.json({ pick: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const totalGoals = Number(body.totalGoals);

    if (!Number.isInteger(totalGoals) || totalGoals < 0) {
      return NextResponse.json({ error: "Invalid tiebreaker" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const settings = await fetchSettings(supabase);
    const locks = getEffectiveLocks(settings);

    if (!locks.knockoutBracketPublished) {
      return NextResponse.json(
        { error: "Knockout bracket not yet published" },
        { status: 403 },
      );
    }

    if (locks.knockoutStageLocked) {
      return NextResponse.json(
        { error: "Knockout picks are locked" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("tiebreaker_predictions")
      .upsert(
        {
          user_id: userId,
          total_goals: totalGoals,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to save tiebreaker" },
        { status: 500 },
      );
    }

    return NextResponse.json({ tiebreaker: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
