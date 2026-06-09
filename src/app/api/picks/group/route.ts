import { NextResponse } from "next/server";
import { fetchSettings, getEffectiveLocks } from "@/lib/locks";
import { createServiceClient } from "@/lib/supabase";
import { isValidGroupRanking } from "@/lib/teams";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

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
    const body = await request.json();
    const userId = String(body.userId ?? "");
    const groupCode = String(body.groupCode ?? "").toUpperCase();
    const ranking = Array.isArray(body.ranking)
      ? body.ranking.map(String)
      : [];

    if (!userId || !groupCode) {
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

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("group_picks")
      .upsert(
        {
          user_id: userId,
          group_code: groupCode,
          rank1_team: ranking[0],
          rank2_team: ranking[1],
          rank3_team: ranking[2],
          rank4_team: ranking[3],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,group_code" },
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
