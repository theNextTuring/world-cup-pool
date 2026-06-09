import { NextResponse } from "next/server";
import { publicUser } from "@/lib/auth";
import { getSessionUserId, unauthorized } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const supabase = createServiceClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, entry_name, created_at")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return unauthorized();
    }

    const [groupPicks, knockoutPicks, tiebreaker] = await Promise.all([
      supabase.from("group_picks").select("*").eq("user_id", userId),
      supabase.from("knockout_picks").select("*").eq("user_id", userId),
      supabase
        .from("tiebreaker_predictions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      user: publicUser(user),
      groupPicks: groupPicks.data ?? [],
      knockoutPicks: knockoutPicks.data ?? [],
      tiebreaker: tiebreaker.data ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
