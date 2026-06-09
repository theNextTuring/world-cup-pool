import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  getAdminSecret,
  signAdminToken,
} from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const secret = String(body.secret ?? "");

    if (secret !== getAdminSecret()) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, await signAdminToken(), adminCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
