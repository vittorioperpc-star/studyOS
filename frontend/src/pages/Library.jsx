import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import UploadDialog from "@/components/UploadDialog";
import { toast } from "sonner";

export default function Library() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await api.get("/materials");
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm("Eliminare questo materiale?")) return;
    await api.delete(`/materials/${id}`);
    toast.success("Eliminato");
    load();
  };

  const filtered = items.filter((i) => i.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-8" data-testid="library-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Libreria</div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold">I tuoi materiali</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-black hover:bg-black/90 h-10" data-testid="new-material-btn">
          <Plus className="h-4 w-4 mr-1.5" /> Nuovo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per titolo…" className="pl-9 h-10" data-testid="library-search" />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-lg p-16 text-center bg-[#FAFAF9]">
          <p className="text-sm text-slate-600">Nessun materiale trovato.</p>
          <Button onClick={() => setOpen(true)} className="mt-4 bg-black hover:bg-black/90" data-testid="library-empty-upload">Carica il primo</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="group border border-slate-200 rounded-lg p-5 hover:shadow-sm transition-all bg-white relative">
              <Link to={`/material/${m.id}`} className="block" data-testid={`lib-material-${m.id}`}>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span>{m.source_type === "pdf" ? "📄" : m.source_type === "image" ? "🖼️" : "📝"}</span>
                  <span>{new Date(m.created_at).toLocaleDateString("it-IT")}</span>
                </div>
                <h3 className="font-heading font-medium text-lg mt-2 line-clamp-2">{m.title}</h3>
                <p className="mt-2 text-sm text-slate-500 line-clamp-3">{m.summary?.slice(0, 150) || "—"}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                  <span className="border border-slate-200 rounded px-1.5 py-0.5">{(m.flashcards?.length || 0)} flashcard</span>
                  <span className="border border-slate-200 rounded px-1.5 py-0.5">{(m.quiz?.length || 0)} quiz</span>
                </div>
              </Link>
              <button onClick={() => del(m.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition" aria-label="Elimina" data-testid={`delete-${m.id}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <UploadDialog open={open} onOpenChange={setOpen} onCreated={() => { setOpen(false); load(); }} />
    </div>
  );
}
