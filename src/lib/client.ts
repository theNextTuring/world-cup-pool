"use client";

export const USER_ID_KEY = "poolUserId";

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function storeUserId(id: string): void {
  localStorage.setItem(USER_ID_KEY, id);
}

export function clearStoredUserId(): void {
  localStorage.removeItem(USER_ID_KEY);
}
