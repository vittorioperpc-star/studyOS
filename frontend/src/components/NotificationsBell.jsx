import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Bell, BellRing, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { registerPush } from "@/lib/push";
import { toast } from "sonner";

export default function NotificationsBell() {
  const [data, setData] = useState({ items: [], unread: 0 });
  const nav = useNavigate();

  const load = useCallback(async () => {
    try { const { data } = await api.get("/notifications"); setData(data); } catch {}
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  const markAll = async () => { await api.post("/notifications/read-all"); load(); };
  const open = async (n) => {
    if (!n.read) { await api.post(`/notifications/${n.id}/read`); }
    if (n.link) nav(n.link);
    load();
  };

  const enablePush = async () => {
    try { await registerPush(); toast.success("Notifiche push attivate ✓"); }
    catch (e) { toast.error(e.message || "Errore"); }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative h-9 w-9 grid place-items-center rounded-md hover:bg-slate-100 transition" data-testid="notifications-bell">
          {data.unread > 0 ? <BellRing className="h-5 w-5 text-slate-900" /> : <Bell className="h-5 w-5 text-slate-600" />}
          {data.unread > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" data-testid="notif-dot" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-slate-200">
          <h3 className="font-heading font-medium text-sm">Notifiche</h3>
          {data.items.length > 0 && (
            <button onClick={markAll} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1" data-testid="mark-all-read">
              <Check className="h-3 w-3" /> Segna tutte
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {data.items.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Nessuna notifica.</div>
          ) : (
            data.items.map((n) => (
              <button
                key={n.id} onClick={() => open(n)}
                className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition ${!n.read ? "bg-yellow-50/40" : ""}`}
                data-testid={`notif-${n.id}`}
              >
                <div className="text-sm font-medium text-slate-900 line-clamp-1">{n.title}</div>
                <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.body}</div>
                <div className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString("it-IT")}</div>
              </button>
            ))
          )}
        </div>
        <div className="p-3 border-t border-slate-200">
          <Button onClick={enablePush} variant="outline" className="w-full h-9 text-xs border-slate-200" data-testid="enable-push-btn">
            <BellRing className="h-3.5 w-3.5 mr-1.5" /> Attiva notifiche push
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
