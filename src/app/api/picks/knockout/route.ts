import { NextResponse } from "next/server";
import { fetchSettings, getEffectiveLocks } from "@/lib/locks";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const [picksRes, tiebreakerRes, matchesRes, settings] = await Promise.all([
      supabase.from("knockout_picks").select("*").eq("user_id", userId),
      supabase
        .from("tiebreaker_predictions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("knockout_matches")
        .select("*")
        .order("round")
        .order("match_number"),
      fetchSettings(supabase),
    ]);

    const locks = getEffectiveLocks(settings);

    return NextResponse.json({
      picks: picksRes.data ?? [],
      tiebreaker: tiebreakerRes.data ?? null,
      matches: matchesRes.data ?? [],
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
    const body = await request.json();
    const userId = String(body.userId ?? "");
    const matchId = String(body.matchId ?? "");
    const pickedWinner = String(body.pickedWinner ?? "");

    if (!userId || !matchId || !pickedWinner) {
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

    const { data: match } = await supabase
      .from("knockout_matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (pickedWinner !== match.team_a && pickedWinner !== match.team_b) {
      return NextResponse.json({ error: "Invalid winner pick" }, { status: 400 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    const body = await request.json();
    const userId = String(body.userId ?? "");
    const totalGoals = Number(body.totalGoals);

    if (!userId || !Number.isInteger(totalGoals) || totalGoals < 0) {
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

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
