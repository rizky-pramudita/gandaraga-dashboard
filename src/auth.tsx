import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "./api/client";

interface AuthState {
  token: string;
  authed: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string>(getToken());

  const login = useCallback(async (candidate: string) => {
    setToken(candidate);
    // Validate the token by making an authenticated call.
    try {
      await api.verify();
      setTok(candidate);
    } catch (e) {
      clearToken();
      setTok("");
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTok("");
  }, []);

  const value = useMemo<AuthState>(
    () => ({ token, authed: token.length > 0, login, logout }),
    [token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
