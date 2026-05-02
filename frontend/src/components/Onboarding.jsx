import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Upload, Brain, Calendar, MessageSquare, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Sparkles,
    title: "Benvenuto su StudyOS! 🎉",
    body: "Trasforma PDF, foto degli appunti e testo in materiale di studio AI: riassunti, flashcard, quiz e piani.",
    grad: "from-blue-500 to-violet-600",
  },
  {
    icon: Upload,
    title: "1. Carica il tuo materiale",
    body: "Clicca su \"Nuovo materiale\" e carica un PDF, una foto degli appunti o incolla del testo. Funziona anche con la calligrafia!",
    grad: "from-violet-500 to-fuchsia-600",
  },
  {
    icon: Brain,
    title: "2. Lascia lavorare l'AI",
    body: "Claude Sonnet 4.5 legge tutto, capisce i concetti e ti prepara: riassunto, schema strutturato, flashcard, quiz e domande d'esame.",
    grad: "from-fuchsia-500 to-pink-600",
  },
  {
    icon: MessageSquare,
    title: "3. Studia e chiedi",
    body: "Apri un materiale → studia con flashcard a ripetizione spaziata, fai i quiz e chatta con l'AI per chiarire i dubbi.",
    grad: "from-amber-500 to-orange-600",
  },
  {
    icon: Calendar,
    title: "4. Pianifica l'esame",
    body: "Vai su \"Piano Studio\", inserisci data dell'esame e numero di pagine. StudyOS crea il calendario giornaliero per te.",
    grad: "from-emerald-500 to-teal-600",
  },
];

const KEY = "studyos_onboarding_done";

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  const step = STEPS[idx];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0" data-testid="onboarding-modal">
        <DialogTitle className="sr-only">Tutorial StudyOS</DialogTitle>
        <DialogDescription className="sr-only">Scopri come usare StudyOS in 5 passi.</DialogDescription>
        <div className={`bg-gradient-to-br ${step.grad} text-white px-8 pt-10 pb-12 text-center`}>
          <div className="h-14 w-14 mx-auto rounded-2xl bg-white/20 backdrop-blur grid place-items-center">
            <step.icon className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mt-5">{step.title}</h2>
          <p className="mt-3 text-white/90 leading-relaxed">{step.body}</p>
        </div>
        <div className="bg-white px-6 py-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-7 bg-slate-900" : "w-1.5 bg-slate-300"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={close} className="text-slate-500 hover:text-slate-900 text-sm" data-testid="onboarding-skip">
              Salta
            </Button>
            {idx > 0 && (
              <Button variant="outline" size="icon" onClick={() => setIdx(idx - 1)} data-testid="onboarding-prev">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {idx < STEPS.length - 1 ? (
              <Button onClick={() => setIdx(idx + 1)} className="bg-slate-900 hover:bg-slate-800 rounded-full px-5" data-testid="onboarding-next">
                Avanti <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={close} className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 hover:opacity-90 rounded-full px-5" data-testid="onboarding-finish">
                Inizia! <Sparkles className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
