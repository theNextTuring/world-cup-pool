import { NextResponse } from "next/server";
import { createUserWithPassword, publicUser } from "@/lib/auth";
import { validatePassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = String(body.firstName ?? "");
    const lastName = String(body.lastName ?? "");
    const password = String(body.password ?? "");

    if (!firstName.trim() || !lastName.trim()) {
      return NextResponse.json(
        { error: "First and last name are required" },
        { status: 400 },
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const supabase = createServiceClient();
    const user = await createUserWithPassword(
      supabase,
      firstName,
      lastName,
      password,
    );

    const response = NextResponse.json({ user: publicUser(user) });
    return setSessionCookie(response, user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
