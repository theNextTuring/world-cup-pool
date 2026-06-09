export function buildEntryName(firstName: string, lastName: string): string {
  const clean = (value: string) =>
    value.trim().replace(/[^a-zA-Z]/g, "");
  const first = clean(firstName);
  const last = clean(lastName);
  return `${first}${last}`;
}

import type { SupabaseClient } from "@supabase/supabase-js";

export async function generateUniqueEntryName(
  supabase: SupabaseClient,
  firstName: string,
  lastName: string,
): Promise<string> {
  const base = buildEntryName(firstName, lastName);
  if (!base) {
    throw new Error("Invalid name");
  }

  const { data: exact } = await supabase
    .from("users")
    .select("entry_name")
    .eq("entry_name", base);

  if (!exact?.length) {
    return base;
  }

  const { data: similar } = await supabase
    .from("users")
    .select("entry_name")
    .like("entry_name", `${base}%`);

  const used = new Set((similar ?? []).map((row) => row.entry_name));
  let suffix = 2;
  while (used.has(`${base}${suffix}`)) {
    suffix += 1;
  }
  return `${base}${suffix}`;
}
