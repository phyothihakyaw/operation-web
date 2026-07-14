"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { logout as apiLogout, getCurrentUser, type MeResponse } from "@/lib/api/auth";
import { isApiConfigured } from "@/lib/api/config";

export const LOGIN_PATH = "/auth/login";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: MeResponse | null;
  /** Re-fetches the authenticated profile, e.g. right after a successful login. */
  refresh: () => Promise<void>;
  /** Ends the session and redirects to the login screen. */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<MeResponse | null>(null);

  const refresh = useCallback(async () => {
    if (!isApiConfigured) {
      setStatus("unauthenticated");
      setUser(null);
      return;
    }
    try {
      const me = await getCurrentUser();
      setUser(me);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus("unauthenticated");
    router.push(LOGIN_PATH);
  }, [router]);

  const value = useMemo(() => ({ status, user, refresh, signOut }), [status, user, refresh, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
