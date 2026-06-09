import { NextResponse } from "next/server";
import { fetchSettings, getEffectiveLocks } from "@/lib/locks";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const settings = await fetchSettings(supabase);
    const locks = getEffectiveLocks(settings);

    return NextResponse.json({
      settings,
      locks,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
