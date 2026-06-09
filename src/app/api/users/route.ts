import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { generateUniqueEntryName } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First and last name are required" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const entryName = await generateUniqueEntryName(
      supabase,
      firstName,
      lastName,
    );

    const { data, error } = await supabase
      .from("users")
      .insert({ first_name: firstName, last_name: lastName, entry_name: entryName })
      .select("id, first_name, last_name, entry_name, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create user" },
        { status: 500 },
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, entry_name, created_at")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: groupPicks } = await supabase
      .from("group_picks")
      .select("*")
      .eq("user_id", userId);

    const { data: knockoutPicks } = await supabase
      .from("knockout_picks")
      .select("*")
      .eq("user_id", userId);

    const { data: tiebreaker } = await supabase
      .from("tiebreaker_predictions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return NextResponse.json({
      user,
      groupPicks: groupPicks ?? [],
      knockoutPicks: knockoutPicks ?? [],
      tiebreaker: tiebreaker ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
