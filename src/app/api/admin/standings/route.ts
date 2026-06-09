import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminAuthenticated } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase";
import { isValidGroupRanking } from "@/lib/teams";

export async function GET() {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("group_standings").select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ standings: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const body = await request.json();
    const groupCode = String(body.groupCode ?? "").toUpperCase();
    const ranking = Array.isArray(body.ranking)
      ? body.ranking.map(String)
      : [];

    if (!isValidGroupRanking(groupCode, ranking)) {
      return NextResponse.json(
        { error: "Invalid group ranking" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("group_standings")
      .upsert(
        {
          group_code: groupCode,
          rank1_team: ranking[0],
          rank2_team: ranking[1],
          rank3_team: ranking[2],
          rank4_team: ranking[3],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "group_code" },
      )
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to save standings" },
        { status: 500 },
      );
    }

    return NextResponse.json({ standing: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
