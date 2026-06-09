import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppSettings } from "./supabase";

export type EffectiveLocks = {
  groupStageLocked: boolean;
  knockoutStageLocked: boolean;
  groupDeadline: string;
  knockoutDeadline: string | null;
  knockoutBracketPublished: boolean;
  actualTotalKnockoutGoals: number | null;
};

export function getEffectiveLocks(settings: AppSettings): EffectiveLocks {
  const now = Date.now();
  const groupDeadlineMs = new Date(settings.group_deadline).getTime();
  const knockoutDeadlineMs = settings.knockout_deadline
    ? new Date(settings.knockout_deadline).getTime()
    : null;

  const groupStageLocked =
    settings.group_stage_locked || now >= groupDeadlineMs;
  const knockoutStageLocked =
    settings.knockout_stage_locked ||
    (knockoutDeadlineMs !== null && now >= knockoutDeadlineMs);

  return {
    groupStageLocked,
    knockoutStageLocked,
    groupDeadline: settings.group_deadline,
    knockoutDeadline: settings.knockout_deadline,
    knockoutBracketPublished: settings.knockout_bracket_published,
    actualTotalKnockoutGoals: settings.actual_total_knockout_goals,
  };
}

export async function fetchSettings(
  supabase: SupabaseClient,
): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error("Failed to load app settings");
  }

  return data;
}
