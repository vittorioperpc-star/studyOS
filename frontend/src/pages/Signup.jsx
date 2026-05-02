import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password di almeno 6 caratteri");
    setLoading(true);
    try {
      await signup(email, pw, name);
      toast.success("Account creato!");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Errore");
    } finally { setLoading(false); }
  };

  const google = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAFAF9]">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-10 justify-center">
          <div className="h-8 w-8 rounded-md bg-black text-white grid place-items-center font-heading font-semibold">S</div>
          <span className="font-heading font-semibold text-xl">StudyOS</span>
        </Link>
        <div className="border border-slate-200 bg-white rounded-xl p-7">
          <h1 className="font-heading text-2xl font-semibold">Crea il tuo account</h1>
          <p className="text-sm text-slate-500 mt-1">3 upload gratis al giorno inclusi</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="signup-name-input" className="mt-1.5 h-10" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required data-testid="signup-email-input" className="mt-1.5 h-10" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Password</Label>
              <Input value={pw} onChange={(e) => setPw(e.target.value)} type="password" required minLength={6} data-testid="signup-password-input" className="mt-1.5 h-10" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 bg-black hover:bg-black/90" data-testid="signup-submit-btn">
              {loading ? "..." : "Crea account"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" /> oppure <div className="flex-1 h-px bg-slate-200" />
          </div>
          <Button type="button" variant="outline" onClick={google} className="w-full h-10 rounded-md border-slate-200" data-testid="google-signup-btn">
            Continua con Google
          </Button>

          <p className="mt-6 text-sm text-slate-600 text-center">
            Hai già un account? <Link to="/login" className="text-slate-900 font-medium underline underline-offset-2" data-testid="goto-login">Accedi</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
