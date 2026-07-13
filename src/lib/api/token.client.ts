"use client";

import { getLocalStorageValue, setLocalStorageValue } from "@/lib/local-storage.client";

const ACCESS_TOKEN_KEY = "learnwu.access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return getLocalStorageValue(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  setLocalStorageValue(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // storage unavailable (private mode, SSR) — nothing to clear
  }
}
