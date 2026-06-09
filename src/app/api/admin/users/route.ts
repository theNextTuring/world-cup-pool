import { NextResponse } from "next/server";
import { adminUnauthorized, isAdminAuthenticated } from "@/lib/admin";
import { hashPassword, validatePassword } from "@/lib/password";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, entry_name, password_hash, created_at")
      .order("entry_name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      users: (data ?? []).map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        entryName: user.entry_name,
        hasPassword: Boolean(user.password_hash),
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const body = await request.json();
    const userId = String(body.userId ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const supabase = createServiceClient();
    const passwordHash = await hashPassword(newPassword);

    const { data, error } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", userId)
      .select("id, first_name, last_name, entry_name")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        entryName: data.entry_name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
