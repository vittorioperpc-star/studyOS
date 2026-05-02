import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LifeBuoy, Send, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open && msgs.length === 0) {
      api.get(`/support/chat/history`).then((r) => setMsgs(r.data)).catch(() => {});
    }
  }, [open, msgs.length]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const q = input.trim();
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: q, id: `u-${Date.now()}` }]);
    setSending(true);
    try {
      const { data } = await api.post(`/support/chat`, { message: q }, { timeout: 90000 });
      setMsgs((m) => [...m, { role: "assistant", content: data.reply, id: `a-${Date.now()}` }]);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Errore chat assistenza");
    } finally { setSending(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:scale-110 active:scale-95 transition flex items-center justify-center z-30"
        data-testid="open-support-btn"
        aria-label="Assistenza AI"
      >
        <LifeBuoy className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end fade-in" data-testid="support-drawer">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="relative w-full sm:w-[400px] bg-white border-l border-slate-200 flex flex-col h-full">
            <header className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-white/20 grid place-items-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">Assistenza StudyOS</h3>
                  <p className="text-xs text-white/80">Online · Risposta in pochi secondi</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Chiudi" data-testid="close-support-btn" className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
              {msgs.length === 0 && (
                <div className="text-center mt-6">
                  <div className="inline-flex h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white grid place-items-center mb-3">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-slate-600">Ciao! Sono l'assistente di StudyOS.</p>
                  <p className="text-xs text-slate-500 mt-1">Chiedimi come usare le funzioni, suggerimenti per studiare, o info sul piano Premium.</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {["Come carico un PDF?", "Come funziona il piano studio?", "Cos'è Premium?"].map((q) => (
                      <button key={q} onClick={() => setInput(q)} className="text-xs px-2.5 py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 transition" data-testid="support-quick-q">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-slate-900 text-white rounded-br-sm"
                      : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm"
                  }`} data-testid={`support-msg-${m.role}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl text-sm">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-slate-200 p-3 flex gap-2 bg-white">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Scrivi un messaggio…"
                className="h-10"
                disabled={sending}
                data-testid="support-input"
              />
              <Button onClick={send} disabled={sending || !input.trim()} className="h-10 bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90" data-testid="support-send-btn">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
