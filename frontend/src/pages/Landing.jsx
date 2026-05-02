import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Brain, Calendar, Check, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link to="/" className="flex items-center gap-2" data-testid="landing-logo">
            <div className="h-7 w-7 rounded-md bg-black text-white grid place-items-center font-heading font-semibold">S</div>
            <span className="font-heading font-semibold text-lg">StudyOS</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/pricing" className="text-sm px-3 py-2 text-slate-600 hover:text-slate-900" data-testid="nav-pricing">Prezzi</Link>
            <Link to="/login" className="text-sm px-3 py-2 text-slate-600 hover:text-slate-900" data-testid="nav-login">Accedi</Link>
            <Link to="/signup" data-testid="nav-signup">
              <Button className="bg-black hover:bg-black/90 rounded-md text-sm h-9">Inizia gratis</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-28 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-xs text-slate-600 mb-6">
            <Sparkles className="h-3 w-3" /> Powered by Claude Sonnet 4.5
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
            Studia <span className="highlight-yellow">il doppio più veloce</span>.<br/>
            Con l&apos;AI che capisce i tuoi appunti.
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
            Carica PDF o foto degli appunti. StudyOS genera automaticamente riassunti, schemi,
            flashcard, quiz e un piano di studio su misura per il tuo esame.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" data-testid="hero-cta-signup">
              <Button className="bg-black hover:bg-black/90 h-11 px-5 text-sm rounded-md">
                Prova gratis <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing" data-testid="hero-cta-pricing">
              <Button variant="outline" className="h-11 px-5 text-sm rounded-md border-slate-200">Vedi piani</Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Gratis per iniziare</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> No carta richiesta</span>
          </div>
        </div>

        <div className="mt-16 rounded-xl overflow-hidden border border-slate-200">
          <img
            src="https://images.pexels.com/photos/19314243/pexels-photo-19314243.jpeg"
            alt="Studente che prende appunti"
            className="w-full h-[320px] md:h-[440px] object-cover"
          />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, title: "Carica & Estrai", desc: "PDF e foto di appunti. OCR automatico con AI multimodale." },
            { icon: Brain, title: "Genera contenuti", desc: "Riassunti, schemi, flashcard, quiz e domande d'esame in un click." },
            { icon: Calendar, title: "Piano su misura", desc: "Data esame e pagine: calendario giornaliero con ripetizione intelligente." },
          ].map((f) => (
            <div key={f.title} className="border border-slate-200 rounded-lg p-6">
              <f.icon className="h-5 w-5 text-slate-900" strokeWidth={1.5} />
              <h3 className="font-heading font-medium text-xl mt-4">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} StudyOS — Studia meglio, non di più.
      </footer>
    </div>
  );
}
