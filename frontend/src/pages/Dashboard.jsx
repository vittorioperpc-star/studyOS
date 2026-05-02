import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { BookOpen, Upload, Sparkles, BarChart3, Calendar, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadDialog from "@/components/UploadDialog";

function StatCard({ label, value, sub }) {
  return (
    <div className="border border-slate-200 rounded-lg p-5 bg-white">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 font-heading text-3xl font-semibold text-slate-900">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [mats, setMats] = useState([]);
  const [openUpload, setOpenUpload] = useState(false);
  const [limits, setLimits] = useState(null);

  const load = async () => {
    try {
      const s = await api.get("/stats/overview");
      setStats(s.data);
    } catch (e) { setStats({ materials: 0, quizzes_taken: 0, avg_score_pct: 0, flashcards_reviewed: 0, activity: [] }); }
    try {
      const m = await api.get("/materials");
      setMats(m.data);
    } catch (e) { setMats([]); }
    try {
      const l = await api.get("/me/limits");
      setLimits(l.data);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-10" data-testid="dashboard-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Dashboard</div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-slate-900">Ciao, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-slate-600 mt-1 text-sm">Ecco cosa c&apos;è oggi in StudyOS.</p>
        </div>
        <Button onClick={() => setOpenUpload(true)} className="bg-black hover:bg-black/90 rounded-md h-10" data-testid="quick-upload-btn">
          <Plus className="h-4 w-4 mr-1.5" /> Nuovo materiale
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Materiali" value={stats?.materials ?? "—"} />
        <StatCard label="Quiz svolti" value={stats?.quizzes_taken ?? "—"} />
        <StatCard label="Media punteggio" value={stats ? `${stats.avg_score_pct}%` : "—"} />
        <StatCard label="Flashcard riviste" value={stats?.flashcards_reviewed ?? "—"} />
      </div>

      {limits && limits.plan === "free" && (
        <div className="border border-slate-200 rounded-xl bg-gradient-to-br from-violet-50 via-blue-50 to-fuchsia-50 p-5" data-testid="limits-card">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-violet-700 font-semibold">Piano Free</div>
              <div className="font-heading text-lg font-medium mt-1">Utilizzo di oggi</div>
            </div>
            <Link to="/pricing" className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 text-white hover:opacity-90" data-testid="dashboard-upgrade">
              Sblocca tutto →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ["Upload", limits.limits.uploads],
              ["AI Chat", limits.limits.chat_messages],
              ["Piani studio", limits.limits.study_plans],
            ].map(([k, v]) => {
              const pct = v.max ? Math.min(100, (v.used / v.max) * 100) : 0;
              return (
                <div key={k} className="bg-white/70 backdrop-blur rounded-lg p-3 border border-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{k}</span>
                    <span className="font-medium text-slate-900">{v.used}/{v.max}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-violet-600"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-medium">Ultimi materiali</h2>
          <Link to="/library" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1" data-testid="goto-library">
            Vedi tutti <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {mats.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-lg p-10 text-center bg-[#FAFAF9]">
            <BookOpen className="h-6 w-6 mx-auto text-slate-400" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-slate-600">Non hai ancora caricato nulla.</p>
            <Button onClick={() => setOpenUpload(true)} className="mt-4 bg-black hover:bg-black/90" data-testid="empty-upload-btn">
              <Upload className="h-4 w-4 mr-1.5" /> Carica il primo materiale
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mats.slice(0, 6).map((m) => (
              <Link key={m.id} to={`/material/${m.id}`} className="border border-slate-200 rounded-lg p-5 hover:shadow-sm hover:-translate-y-0.5 transition-all bg-white" data-testid={`material-card-${m.id}`}>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span>{m.source_type === "pdf" ? "📄" : m.source_type === "image" ? "🖼️" : "📝"}</span>
                  <span>{new Date(m.created_at).toLocaleDateString("it-IT")}</span>
                </div>
                <h3 className="font-heading font-medium text-lg mt-2 line-clamp-2">{m.title}</h3>
                <p className="mt-2 text-sm text-slate-500 line-clamp-3">{m.summary?.slice(0, 140) || "—"}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Link to="/study-plan" className="border border-slate-200 rounded-lg p-5 bg-white hover:shadow-sm hover:-translate-y-0.5 transition-all" data-testid="shortcut-plan">
          <Calendar className="h-5 w-5" strokeWidth={1.5} />
          <h3 className="font-heading font-medium text-lg mt-3">Piano di studio</h3>
          <p className="text-sm text-slate-500 mt-1">Dai all&apos;AI la data dell&apos;esame e ottieni un calendario giornaliero.</p>
        </Link>
        <Link to="/stats" className="border border-slate-200 rounded-lg p-5 bg-white hover:shadow-sm hover:-translate-y-0.5 transition-all" data-testid="shortcut-stats">
          <BarChart3 className="h-5 w-5" strokeWidth={1.5} />
          <h3 className="font-heading font-medium text-lg mt-3">Statistiche</h3>
          <p className="text-sm text-slate-500 mt-1">Traccia i tuoi progressi e la ritenzione delle flashcard.</p>
        </Link>
      </section>

      <UploadDialog open={openUpload} onOpenChange={setOpenUpload} onCreated={() => { setOpenUpload(false); load(); }} />
    </div>
  );
}
