import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

const features_free = [
  "3 upload al giorno",
  "Riassunti, schemi e flashcard",
  "Quiz base",
  "1 piano di studio attivo",
];
const features_premium = [
  "Upload illimitati",
  "Quiz avanzati + spiegazioni",
  "Piani di studio illimitati",
  "Tracking progresso completo",
  "Priorità nelle code AI",
];

export default function Pricing() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();

  const upgrade = async () => {
    if (!user) return nav("/signup");
    try {
      await api.post("/billing/upgrade");
      await refresh();
      toast.success("Benvenuto in Premium! 🎉");
      nav("/dashboard");
    } catch { toast.error("Errore"); }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-black text-white grid place-items-center font-heading font-semibold">S</div>
            <span className="font-heading font-semibold text-lg">StudyOS</span>
          </Link>
          <Link to={user ? "/dashboard" : "/login"} className="text-sm text-slate-600 hover:text-slate-900" data-testid="pricing-to-app">
            {user ? "Vai all'app" : "Accedi"}
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Prezzi</div>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold">Semplice, trasparente.</h1>
          <p className="mt-3 text-slate-600">Inizia gratis. Sblocca tutto con Premium.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="border border-slate-200 rounded-xl p-8 bg-white">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Free</div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-heading text-5xl font-semibold">€0</span>
              <span className="text-slate-500 text-sm">/ sempre</span>
            </div>
            <p className="text-sm text-slate-600 mt-3">Perfetto per iniziare.</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {features_free.map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-slate-900" />{f}</li>
              ))}
            </ul>
            <Link to={user ? "/dashboard" : "/signup"}>
              <Button variant="outline" className="w-full mt-8 h-11 border-slate-200" data-testid="pricing-free-btn">
                {user ? "Piano attuale" : "Inizia gratis"}
              </Button>
            </Link>
          </div>

          <div className="border-2 border-slate-900 rounded-xl p-8 bg-white relative">
            <div className="absolute -top-3 left-8 bg-yellow-200 text-slate-900 px-2.5 py-0.5 text-[11px] rounded-full font-medium">Consigliato</div>
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Premium</div>
              <Crown className="h-4 w-4" />
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-heading text-5xl font-semibold">€9</span>
              <span className="text-slate-500 text-sm">/ mese</span>
            </div>
            <p className="text-sm text-slate-600 mt-3">Illimitato, tutto sbloccato.</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {features_premium.map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-slate-900" />{f}</li>
              ))}
            </ul>
            <Button onClick={upgrade} className="w-full mt-8 h-11 bg-black hover:bg-black/90" data-testid="pricing-upgrade-btn">
              {user?.plan === "premium" ? "Già Premium ✓" : "Passa a Premium"}
            </Button>
            <p className="text-[11px] text-slate-400 mt-3 text-center">Attivazione istantanea — pagamento Stripe in arrivo.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
