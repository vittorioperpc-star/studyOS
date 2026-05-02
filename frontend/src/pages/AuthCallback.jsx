import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AuthCallback() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const run = async () => {
      const hash = window.location.hash;
      const match = hash.match(/session_id=([^&]+)/);
      if (!match) return nav("/login");
      const session_id = match[1];
      try {
        const { data } = await api.post("/auth/session", { session_id });
        localStorage.setItem("studyos_token", data.token);
        setUser(data.user);
        window.history.replaceState(null, "", "/dashboard");
        nav("/dashboard", { state: { user: data.user } });
      } catch (e) {
        nav("/login");
      }
    };
    run();
  }, [nav, setUser]);

  return (
    <div className="min-h-screen grid place-items-center text-slate-400 text-sm">
      Autenticazione in corso…
    </div>
  );
}
