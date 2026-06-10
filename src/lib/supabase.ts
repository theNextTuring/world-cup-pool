import { createClient } from "@supabase/supabase-js";

export type AppSettings = {
  id: number;
  group_deadline: string;
  knockout_deadline: string | null;
  group_stage_locked: boolean;
  knockout_stage_locked: boolean;
  knockout_bracket_published: boolean;
  actual_total_knockout_goals: number | null;
  group_rank1_points: number;
  group_rank2_points: number;
  group_rank3_points: number;
  group_rank4_points: number;
  knockout_r32_points: number;
  knockout_r16_points: number;
  knockout_qf_points: number;
  knockout_sf_points: number;
  knockout_final_points: number;
};

export type DbUser = {
  id: string;
  first_name: string;
  last_name: string;
  entry_name: string;
  created_at: string;
};

export type GroupPick = {
  id: string;
  user_id: string;
  group_code: string;
  rank1_team: string;
  rank2_team: string;
  rank3_team: string;
  rank4_team: string;
  updated_at: string;
};

export type GroupStanding = {
  group_code: string;
  rank1_team: string;
  rank2_team: string;
  rank3_team: string;
  rank4_team: string;
};

export type KnockoutRound = "r32" | "r16" | "qf" | "sf" | "final";

export type KnockoutMatch = {
  id: string;
  round: KnockoutRound;
  match_number: number;
  team_a: string;
  team_b: string;
  winner: string | null;
};

export type KnockoutPick = {
  id: string;
  user_id: string;
  match_id: string;
  picked_winner: string;
};

export type TiebreakerPrediction = {
  user_id: string;
  total_goals: number;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function createServiceClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function createAnonClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
