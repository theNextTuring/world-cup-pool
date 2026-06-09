import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminAuthenticated } from "@/lib/admin";
import { fetchSettings } from "@/lib/locks";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const supabase = createServiceClient();
    const settings = await fetchSettings(supabase);
    return NextResponse.json({ settings });
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
    const supabase = createServiceClient();

    const updates: Record<string, unknown> = {};
    if (body.groupDeadline !== undefined) {
      updates.group_deadline = body.groupDeadline;
    }
    if (body.knockoutDeadline !== undefined) {
      updates.knockout_deadline = body.knockoutDeadline;
    }
    if (body.groupStageLocked !== undefined) {
      updates.group_stage_locked = Boolean(body.groupStageLocked);
    }
    if (body.knockoutStageLocked !== undefined) {
      updates.knockout_stage_locked = Boolean(body.knockoutStageLocked);
    }
    if (body.knockoutBracketPublished !== undefined) {
      updates.knockout_bracket_published = Boolean(body.knockoutBracketPublished);
    }
    if (body.actualTotalKnockoutGoals !== undefined) {
      const value = body.actualTotalKnockoutGoals;
      updates.actual_total_knockout_goals =
        value === null || value === "" ? null : Number(value);
    }

    const { data, error } = await supabase
      .from("app_settings")
      .update(updates)
      .eq("id", 1)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Update failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
