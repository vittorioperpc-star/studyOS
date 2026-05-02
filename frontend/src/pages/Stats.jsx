import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function Stat({ label, value }) {
  return (
    <div className="border border-slate-200 rounded-lg p-5 bg-white">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="font-heading text-3xl font-semibold mt-2">{value}</div>
    </div>
  );
}

export default function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/stats/overview").then((r) => setS(r.data)); }, []);
  if (!s) return <div className="text-slate-400 text-sm">Caricamento…</div>;

  return (
    <div className="space-y-8" data-testid="stats-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Statistiche</div>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold">I tuoi progressi</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Materiali" value={s.materials} />
        <Stat label="Quiz svolti" value={s.quizzes_taken} />
        <Stat label="Media punteggio" value={`${s.avg_score_pct}%`} />
        <Stat label="Flashcard riviste" value={s.flashcards_reviewed} />
      </div>
      <section className="border border-slate-200 rounded-xl bg-white p-6">
        <h2 className="font-heading text-lg font-medium mb-4">Attività ultimi 7 giorni</h2>
        <div style={{ width: "100%", height: 256, minHeight: 256 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={220}>
            <BarChart data={s.activity.map(a => ({ ...a, label: new Date(a.date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric" }) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={11} />
              <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="quizzes" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
