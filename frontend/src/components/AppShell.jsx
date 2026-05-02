import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { BookOpen, LayoutGrid, Calendar, BarChart3, Sparkles, LogOut, Menu, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/library", label: "Libreria", icon: BookOpen },
  { to: "/study-plan", label: "Piano Studio", icon: Calendar },
  { to: "/stats", label: "Statistiche", icon: BarChart3 },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const nav2 = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => { await logout(); nav2("/"); };

  const SidebarInner = (
    <>
      <div className="px-3 pb-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-black text-white grid place-items-center font-heading font-semibold">S</div>
          <span className="font-heading text-lg font-semibold tracking-tight">StudyOS</span>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5" data-testid="sidebar-nav">
        {nav.map((n) => (
          <NavLink
            key={n.to} to={n.to}
            onClick={() => setOpen(false)}
            data-testid={`nav-${n.label.toLowerCase().replace(" ", "-")}`}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-200" : "text-slate-600 hover:bg-white/60"
              }`}
          >
            <n.icon className="h-4 w-4" strokeWidth={1.5} />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="pt-4 border-t border-slate-200 mt-3 space-y-2">
        {user?.plan !== "premium" ? (
          <NavLink to="/pricing" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-black text-white hover:bg-black/90" data-testid="upgrade-sidebar-btn">
            <Crown className="h-4 w-4" /> Passa a Premium
          </NavLink>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-yellow-100 text-slate-900">
            <Sparkles className="h-3.5 w-3.5" /> PREMIUM
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-slate-200 grid place-items-center text-xs font-medium">
            {(user?.name || user?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-slate-900 text-sm" data-testid="user-name">{user?.name}</div>
            <div className="truncate text-xs text-slate-500">{user?.email}</div>
          </div>
          <button onClick={doLogout} className="text-slate-400 hover:text-slate-900" data-testid="logout-btn" aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[#F7F7F5] border-r border-slate-200 flex-col p-4">
        {SidebarInner}
      </aside>

      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-black text-white grid place-items-center font-heading text-sm font-semibold">S</div>
          <span className="font-heading font-semibold">StudyOS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} data-testid="open-mobile-menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col p-4">
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} data-testid="close-mobile-menu">
              <X className="h-5 w-5" />
            </Button>
          </div>
          {SidebarInner}
        </div>
      )}

      <main className="md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-8 md:py-12 fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
