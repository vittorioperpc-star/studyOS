import React, { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function MaterialChat({ materialId }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open && msgs.length === 0) {
      api.get(`/materials/${materialId}/chat/history`).then((r) => setMsgs(r.data)).catch(() => {});
    }
  }, [open, materialId, msgs.length]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const q = input.trim();
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: q, id: `u-${Date.now()}` }]);
    setSending(true);
    try {
      const { data } = await api.post(`/materials/${materialId}/chat`, { message: q }, { timeout: 90000 });
      setMsgs((m) => [...m, { role: "assistant", content: data.reply, id: `a-${Date.now()}` }]);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Errore chat");
    } finally { setSending(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-12 px-4 rounded-full bg-black text-white shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-2 z-30"
        data-testid="open-chat-btn"
      >
        <Sparkles className="h-4 w-4" /> Chiedi all'AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end fade-in" data-testid="chat-drawer">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="relative w-full sm:w-[420px] bg-white border-l border-slate-200 flex flex-col h-full">
            <header className="flex items-center justify-between px-5 h-14 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <h3 className="font-heading font-semibold">Chat col materiale</h3>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Chiudi" data-testid="close-chat-btn" className="text-slate-400 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {msgs.length === 0 && (
                <div className="text-center text-sm text-slate-500 mt-10">
                  <Sparkles className="h-5 w-5 mx-auto mb-2 text-slate-400" />
                  Fai una domanda sul materiale.<br/>
                  <span className="text-xs text-slate-400">Es. "Spiegami il concetto di X"</span>
                </div>
              )}
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "bg-slate-900 text-white rounded-br-sm" : "bg-slate-100 text-slate-900 rounded-bl-sm"
                  }`} data-testid={`chat-msg-${m.role}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-3.5 py-2.5 rounded-2xl text-sm text-slate-500">
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

            <div className="border-t border-slate-200 p-3 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Fai una domanda…"
                className="h-10"
                disabled={sending}
                data-testid="chat-input"
              />
              <Button onClick={send} disabled={sending || !input.trim()} className="h-10 bg-black hover:bg-black/90" data-testid="chat-send-btn">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
