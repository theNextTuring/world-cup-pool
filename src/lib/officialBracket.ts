import type { SupabaseClient } from "@supabase/supabase-js";
import {
  matchesUseOfficialBracket,
  OFFICIAL_KNOCKOUT_MATCHES,
} from "@/lib/bracket";
import type { KnockoutMatch } from "@/lib/supabase";

export async function ensureOfficialKnockoutBracket(
  supabase: SupabaseClient,
): Promise<KnockoutMatch[]> {
  const { data: existing, error: readError } = await supabase
    .from("knockout_matches")
    .select("*")
    .order("match_number");

  if (readError) {
    throw new Error(readError.message);
  }

  if (matchesUseOfficialBracket(existing ?? [])) {
    await publishKnockoutBracket(supabase);
    return existing ?? [];
  }

  const { error: deleteError } = await supabase
    .from("knockout_matches")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("knockout_matches")
    .insert(
      OFFICIAL_KNOCKOUT_MATCHES.map((match) => ({
        round: match.round,
        match_number: match.matchNumber,
        team_a: match.teamA,
        team_b: match.teamB,
        winner: null,
      })),
    )
    .select("*")
    .order("match_number");

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Failed to seed bracket");
  }

  await publishKnockoutBracket(supabase);
  return inserted;
}

async function publishKnockoutBracket(supabase: SupabaseClient) {
  const { error } = await supabase
    .from("app_settings")
    .update({ knockout_bracket_published: true })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message);
  }
}
