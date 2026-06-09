import type { SupabaseClient } from "@supabase/supabase-js";
import { hashPassword, verifyPassword } from "./password";
import { generateUniqueEntryName } from "./users";

export function normalizeName(value: string): string {
  return value.trim();
}

export async function findUsersByName(
  supabase: SupabaseClient,
  firstName: string,
  lastName: string,
) {
  const first = normalizeName(firstName);
  const last = normalizeName(lastName);

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, entry_name, password_hash, created_at")
    .ilike("first_name", first)
    .ilike("last_name", last);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function authenticateByName(
  supabase: SupabaseClient,
  firstName: string,
  lastName: string,
  password: string,
) {
  const matches = await findUsersByName(supabase, firstName, lastName);
  const withPassword = matches.filter((user) => user.password_hash);

  for (const user of withPassword) {
    const valid = await verifyPassword(password, user.password_hash!);
    if (valid) {
      return user;
    }
  }

  return null;
}

export async function createUserWithPassword(
  supabase: SupabaseClient,
  firstName: string,
  lastName: string,
  password: string,
) {
  const first = normalizeName(firstName);
  const last = normalizeName(lastName);
  const entryName = await generateUniqueEntryName(supabase, first, last);
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from("users")
    .insert({
      first_name: first,
      last_name: last,
      entry_name: entryName,
      password_hash: passwordHash,
    })
    .select("id, first_name, last_name, entry_name, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create user");
  }

  return data;
}

export function publicUser(user: {
  id: string;
  first_name: string;
  last_name: string;
  entry_name: string;
  created_at: string;
}) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    entryName: user.entry_name,
    createdAt: user.created_at,
  };
}
