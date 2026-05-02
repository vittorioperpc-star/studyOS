import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function GoogleBtn() {
  const go = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return (
    <Button type="button" variant="outline" onClick={go} className="w-full h-10 rounded-md border-slate-200" data-testid="google-login-btn">
      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Continua con Google
    </Button>
  );
}

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, pw);
      toast.success("Accesso effettuato");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Errore di accesso");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAF9]">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-10 justify-center">
          <div className="h-8 w-8 rounded-md bg-black text-white grid place-items-center font-heading font-semibold">S</div>
          <span className="font-heading font-semibold text-xl">StudyOS</span>
        </Link>
        <div className="border border-slate-200 bg-white rounded-xl p-7">
          <h1 className="font-heading text-2xl font-semibold">Bentornato</h1>
          <p className="text-sm text-slate-500 mt-1">Accedi per continuare a studiare</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required data-testid="login-email-input" className="mt-1.5 h-10" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Password</Label>
              <Input value={pw} onChange={(e) => setPw(e.target.value)} type="password" required data-testid="login-password-input" className="mt-1.5 h-10" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 bg-black hover:bg-black/90 rounded-md" data-testid="login-submit-btn">
              {loading ? "..." : "Accedi"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" /> oppure <div className="flex-1 h-px bg-slate-200" />
          </div>
          <GoogleBtn />

          <p className="mt-6 text-sm text-slate-600 text-center">
            Non hai un account? <Link to="/signup" className="text-slate-900 font-medium underline underline-offset-2" data-testid="goto-signup">Registrati</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
