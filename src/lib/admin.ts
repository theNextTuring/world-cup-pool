import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "pool_admin";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SECRET");
  }
  return secret;
}

function getAdminSecretBytes(): Uint8Array {
  return new TextEncoder().encode(getAdminSecret());
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  };
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getAdminSecretBytes());
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getAdminSecretBytes());
    return payload.admin === true;
  } catch {
    return false;
  }
}

export function adminUnauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
