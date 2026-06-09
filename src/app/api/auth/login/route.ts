import { NextResponse } from "next/server";
import { authenticateByName, publicUser } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = String(body.firstName ?? "");
    const lastName = String(body.lastName ?? "");
    const password = String(body.password ?? "");

    if (!firstName.trim() || !lastName.trim() || !password) {
      return NextResponse.json(
        { error: "First name, last name, and password are required" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const user = await authenticateByName(
      supabase,
      firstName,
      lastName,
      password,
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid name or password" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ user: publicUser(user) });
    return setSessionCookie(response, user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
