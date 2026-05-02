import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // Skip /auth/me when no token AND no session cookie likely set (public pages)
    const hasToken = !!localStorage.getItem("studyos_token");
    if (!hasToken && !document.cookie.includes("session_token")) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser((u) => u || data);  // do not overwrite a just-logged-in user
    } catch {
      setUser((u) => u || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If returning from Emergent OAuth, skip check (AuthCallback handles it)
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("studyos_token", data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  };

  const signup = async (email, password, name) => {
    const { data } = await api.post("/auth/signup", { email, password, name });
    localStorage.setItem("studyos_token", data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("studyos_token");
    setUser(null);
  };

  const refresh = checkAuth;

  return (
    <AuthCtx.Provider value={{ user, setUser, login, signup, logout, loading, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
