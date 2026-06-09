import { NextResponse } from "next/server";
import { fetchSettings, getEffectiveLocks } from "@/lib/locks";
import { getSessionUserId, unauthorized } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase";
import { GROUP_CODES, isValidGroupRanking } from "@/lib/teams";

function rankingToRow(userId: string, groupCode: string, ranking: string[]) {
  return {
    user_id: userId,
    group_code: groupCode,
    rank1_team: ranking[0],
    rank2_team: ranking[1],
    rank3_team: ranking[2],
    rank4_team: ranking[3],
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("group_picks")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ picks: data ?? [] });
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
    const groupCode = String(body.groupCode ?? "").toUpperCase();
    const ranking = Array.isArray(body.ranking)
      ? body.ranking.map(String)
      : [];

    if (!groupCode) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!isValidGroupRanking(groupCode, ranking)) {
      return NextResponse.json(
        { error: "Invalid group ranking" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const settings = await fetchSettings(supabase);
    const locks = getEffectiveLocks(settings);

    if (locks.groupStageLocked) {
      return NextResponse.json(
        { error: "Group stage picks are locked" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("group_picks")
      .upsert(rankingToRow(userId, groupCode, ranking), {
        onConflict: "user_id,group_code",
      })
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

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const rankings =
      body.rankings && typeof body.rankings === "object"
        ? (body.rankings as Record<string, string[]>)
        : null;

    if (!rankings) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    for (const groupCode of GROUP_CODES) {
      const ranking = Array.isArray(rankings[groupCode])
        ? rankings[groupCode].map(String)
        : [];
      if (!isValidGroupRanking(groupCode, ranking)) {
        return NextResponse.json(
          { error: `Invalid ranking for group ${groupCode}` },
          { status: 400 },
        );
      }
    }

    const supabase = createServiceClient();
    const settings = await fetchSettings(supabase);
    const locks = getEffectiveLocks(settings);

    if (locks.groupStageLocked) {
      return NextResponse.json(
        { error: "Group stage picks are locked" },
        { status: 403 },
      );
    }

    const rows = GROUP_CODES.map((groupCode) =>
      rankingToRow(
        userId,
        groupCode,
        rankings[groupCode].map(String),
      ),
    );

    const { data, error } = await supabase
      .from("group_picks")
      .upsert(rows, { onConflict: "user_id,group_code" })
      .select("*");

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to save picks" },
        { status: 500 },
      );
    }

    return NextResponse.json({ picks: data, savedCount: data.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
