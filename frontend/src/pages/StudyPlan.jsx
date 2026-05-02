import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Check } from "lucide-react";
import { toast } from "sonner";

export default function StudyPlanPage() {
  const [plans, setPlans] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", exam_date: "", total_pages: 100 });

  const load = async () => {
    const { data } = await api.get("/study-plans");
    setPlans(data);
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/study-plans", { ...form, total_pages: Number(form.total_pages) });
      toast.success("Piano creato!");
      setOpen(false); setForm({ title: "", exam_date: "", total_pages: 100 });
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Errore");
    }
  };

  const toggleDay = async (planId, i) => {
    await api.patch(`/study-plans/${planId}/day/${i}`);
    load();
  };

  return (
    <div className="space-y-8" data-testid="study-plan-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Piano di studio</div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold">Organizza il tuo esame</h1>
          <p className="text-slate-600 text-sm mt-1">Imposta la data e le pagine: costruiamo il calendario per te.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-black/90 h-10" data-testid="new-plan-btn"><Plus className="h-4 w-4 mr-1.5" /> Nuovo piano</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading">Nuovo piano di studio</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3 pt-2">
              <div>
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Titolo</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1.5 h-10" data-testid="plan-title" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Data esame</Label>
                <Input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} required className="mt-1.5 h-10" data-testid="plan-date" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Pagine totali</Label>
                <Input type="number" min="1" value={form.total_pages} onChange={(e) => setForm({ ...form, total_pages: e.target.value })} required className="mt-1.5 h-10" data-testid="plan-pages" />
              </div>
              <Button type="submit" className="w-full h-10 bg-black hover:bg-black/90" data-testid="plan-submit">Genera calendario</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-lg p-16 text-center bg-[#FAFAF9]">
          <p className="text-sm text-slate-600">Nessun piano ancora. Crea il primo per visualizzare il calendario.</p>
        </div>
      ) : plans.map((p) => (
        <section key={p.id} className="border border-slate-200 rounded-xl bg-white p-6" data-testid={`plan-${p.id}`}>
          <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
            <div>
              <h2 className="font-heading text-xl font-medium">{p.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Esame: {new Date(p.exam_date).toLocaleDateString("it-IT")} • {p.total_pages} pagine • {p.days.length} giorni</p>
            </div>
            <div className="text-xs text-slate-500">
              Completati {p.days.filter((d) => d.done).length} / {p.days.length}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {p.days.map((d, i) => (
              <button key={i} onClick={() => toggleDay(p.id, i)}
                className={`text-left border rounded-md p-3 transition ${
                  d.done ? "border-emerald-300 bg-emerald-50" :
                  d.type === "review" ? "border-yellow-200 bg-yellow-50/50 hover:bg-yellow-50" :
                  "border-slate-200 hover:bg-slate-50"
                }`}
                data-testid={`day-${p.id}-${i}`}
              >
                <div className="text-[11px] uppercase tracking-wider text-slate-500">
                  {new Date(d.date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                </div>
                <div className="text-xs font-medium mt-1 text-slate-900 line-clamp-2">
                  {d.done && <Check className="h-3 w-3 inline mr-1 text-emerald-600" />}
                  {d.topic}
                </div>
                {d.pages && <div className="text-[11px] text-slate-500 mt-1">pp. {d.pages}</div>}
                <div className="text-[10px] mt-1 uppercase tracking-wider text-slate-400">{d.type === "review" ? "Ripasso" : "Studio"}</div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
