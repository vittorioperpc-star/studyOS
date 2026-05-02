import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogoMark, LogoFull } from "@/components/Logo";
import {
  BookOpen, Sparkles, Brain, Calendar, Check, ArrowRight,
  FileUp, MessageSquare, Layers, Trophy, Zap, ScanLine,
} from "lucide-react";

const FEATURES = [
  { icon: ScanLine, title: "OCR intelligente", desc: "Carica foto degli appunti — l'AI legge anche la calligrafia.", grad: "from-blue-500 to-violet-500" },
  { icon: Brain, title: "Riassunti AI", desc: "Pagine intere distillate in concetti chiari, in italiano.", grad: "from-violet-500 to-fuchsia-500" },
  { icon: Layers, title: "Flashcard SM-2", desc: "Ripetizione spaziata: ricordi più con meno tempo.", grad: "from-fuchsia-500 to-pink-500" },
  { icon: Zap, title: "Quiz interattivi", desc: "Verifica subito cosa hai capito, con spiegazioni.", grad: "from-amber-500 to-orange-500" },
  { icon: Calendar, title: "Piano di studio", desc: "Data esame + pagine = calendario su misura.", grad: "from-emerald-500 to-teal-500" },
  { icon: MessageSquare, title: "Chat con il libro", desc: "Chiedi qualsiasi cosa al tuo materiale, ricevi risposte.", grad: "from-cyan-500 to-blue-500" },
];

const STEPS = [
  { n: "01", title: "Carica", desc: "PDF, foto degli appunti o testo incollato. In 1 click." },
  { n: "02", title: "Analizza", desc: "Claude Sonnet 4.5 estrae i concetti, struttura tutto." },
  { n: "03", title: "Studia", desc: "Riassunti, schemi, flashcard, quiz, piano di studio." },
  { n: "04", title: "Ricorda", desc: "Spaced repetition + promemoria push: niente cala." },
];

const TESTIMONIALS = [
  { name: "Giulia M.", role: "Studentessa Medicina", quote: "Ho passato Anatomia con 30. StudyOS mi ha fatto risparmiare settimane." },
  { name: "Marco T.", role: "Liceo Scientifico", quote: "Carico le foto degli appunti, in 30 secondi ho schemi e flashcard pronte." },
  { name: "Sofia R.", role: "Università Bocconi", quote: "Il piano di studio automatico è incredibile. Mai più ansia da esame." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* Animated gradient blob in hero */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] -z-10 opacity-60">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl" />
        <div className="absolute top-40 left-1/2 w-72 h-72 bg-violet-400/30 rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-72 h-72 bg-fuchsia-400/20 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center" data-testid="landing-logo">
            <LogoMark size="md" />
          </Link>
          <nav className="flex items-center gap-1">
            <a href="#features" className="hidden sm:inline text-sm px-3 py-2 text-slate-600 hover:text-slate-900">Funzionalità</a>
            <a href="#how" className="hidden sm:inline text-sm px-3 py-2 text-slate-600 hover:text-slate-900">Come funziona</a>
            <Link to="/pricing" className="text-sm px-3 py-2 text-slate-600 hover:text-slate-900" data-testid="nav-pricing">Prezzi</Link>
            <Link to="/login" className="text-sm px-3 py-2 text-slate-600 hover:text-slate-900" data-testid="nav-login">Accedi</Link>
            <Link to="/signup" data-testid="nav-signup">
              <Button className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 hover:opacity-90 rounded-full text-sm h-10 px-5 shadow-md shadow-violet-500/20">
                Inizia gratis
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50/60 text-xs text-violet-700 mb-8">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Claude Sonnet 4.5
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.02]">
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Studia di meno.</span>
            <br/>
            Impara di più.
          </h1>
          <p className="mt-7 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Carica PDF o foto dei tuoi appunti — StudyOS li trasforma in <span className="text-slate-900 font-medium">riassunti, flashcard, quiz e piani di studio</span> in pochi secondi.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Link to="/signup" data-testid="hero-cta-signup">
              <Button className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 hover:opacity-90 h-12 px-7 text-base rounded-full shadow-lg shadow-violet-500/25">
                Prova gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how">
              <Button variant="outline" className="h-12 px-7 text-base rounded-full border-slate-200">
                Come funziona
              </Button>
            </a>
          </div>
          <div className="mt-7 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Gratis per iniziare</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> No carta richiesta</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> 100% in italiano</span>
          </div>
        </div>

        {/* Hero card with logo + image collage */}
        <div className="mt-20 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl" />
          <div className="relative grid md:grid-cols-5 gap-4">
            <div className="md:col-span-3 rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-violet-500/10">
              <img
                src="https://images.pexels.com/photos/19314243/pexels-photo-19314243.jpeg"
                alt="Studente che prende appunti"
                className="w-full h-[280px] md:h-[420px] object-cover"
              />
            </div>
            <div className="md:col-span-2 grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 shadow-sm">
                <LogoFull className="h-24 mx-auto" />
                <p className="mt-3 text-center text-sm text-slate-600">Il sistema operativo dello studio.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-violet-50 to-fuchsia-50 p-6">
                <Trophy className="h-5 w-5 text-violet-600" strokeWidth={1.5} />
                <p className="mt-3 font-heading font-semibold text-2xl">+47%</p>
                <p className="text-sm text-slate-600">in meno tempo per studiare lo stesso programma*</p>
                <p className="text-[10px] text-slate-400 mt-1">*media stimata sui beta tester</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-[#FAFAF9] border-y border-slate-200 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-[0.2em] text-violet-600 mb-3 font-semibold">Come funziona</div>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold">In 4 step. Niente di più.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="font-heading text-5xl font-bold bg-gradient-to-br from-blue-500 to-violet-600 bg-clip-text text-transparent">
                  {s.n}
                </div>
                <h3 className="font-heading font-semibold text-xl mt-3">{s.title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 h-5 w-5 text-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-violet-600 mb-3 font-semibold">Funzionalità</div>
          <h2 className="font-heading text-3xl sm:text-5xl font-bold">Tutto quello che serve per <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">studiare meglio</span>.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="group border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-white">
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.grad} grid place-items-center text-white shadow-md`}>
                <f.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="font-heading font-semibold text-xl mt-5">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-gradient-to-br from-violet-50 via-blue-50 to-fuchsia-50 py-24 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-[0.2em] text-violet-600 mb-3 font-semibold">Testimonianze</div>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold">Studenti felici. Esami passati.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
                <div className="flex gap-0.5 text-amber-400 mb-3">{"★★★★★"}</div>
                <p className="text-slate-800 leading-relaxed">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 grid place-items-center text-white font-semibold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 p-12 md:p-16 text-white shadow-2xl shadow-violet-500/30">
          <FileUp className="h-10 w-10 mx-auto mb-5 opacity-90" strokeWidth={1.5} />
          <h2 className="font-heading text-3xl sm:text-5xl font-bold leading-tight">Pronti a passare il prossimo esame?</h2>
          <p className="mt-4 text-white/80 text-lg">Carica il primo materiale in 30 secondi. Nessuna carta di credito.</p>
          <Link to="/signup" data-testid="bottom-cta-signup">
            <Button className="mt-8 h-12 px-8 text-base rounded-full bg-white text-slate-900 hover:bg-slate-100">
              Inizia ora <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LogoMark size="sm" />
          </div>
          <div className="text-sm text-slate-500">© {new Date().getFullYear()} StudyOS — Studia meglio, non di più.</div>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link to="/pricing" className="hover:text-slate-900">Prezzi</Link>
            <Link to="/login" className="hover:text-slate-900">Accedi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
