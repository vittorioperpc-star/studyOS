import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCw, Check, X } from "lucide-react";
import { toast } from "sonner";
import MaterialChat from "@/components/MaterialChat";

function MDLite({ text }) {
  // very light markdown-like renderer
  const lines = (text || "").split("\n");
  return (
    <div className="prose-notion max-w-none">
      {lines.map((l, i) => {
        if (l.startsWith("## ")) return <h2 key={i}>{l.slice(3)}</h2>;
        if (l.startsWith("# ")) return <h1 key={i}>{l.slice(2)}</h1>;
        if (l.startsWith("### ")) return <h3 key={i}>{l.slice(4)}</h3>;
        if (l.match(/^\s*[-*] /)) return <li key={i}>{l.replace(/^\s*[-*] /, "")}</li>;
        if (!l.trim()) return <br key={i} />;
        return <p key={i}>{l}</p>;
      })}
    </div>
  );
}

function FlashcardDeck({ material, onUpdate }) {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);
  const cards = material.flashcards || [];
  const card = cards[idx];
  if (!card) return <p className="text-sm text-slate-500">Nessuna flashcard.</p>;

  const review = async (q) => {
    try {
      await api.post(`/materials/${material.id}/flashcards/${card.id}/review`, { card_id: card.id, quality: q });
      toast.success("Salvato");
      setShow(false);
      setIdx((i) => (i + 1) % cards.length);
      onUpdate?.();
    } catch {
      toast.error("Errore");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-xs text-slate-500 mb-3">Carta {idx + 1} / {cards.length}</div>
      <div className="border border-slate-200 rounded-xl bg-white p-8 min-h-[240px] flex items-center justify-center text-center">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">{show ? "Risposta" : "Domanda"}</div>
          <div className="font-heading text-xl sm:text-2xl font-medium leading-relaxed">
            {show ? card.answer : card.question}
          </div>
        </div>
      </div>
      {!show ? (
        <Button onClick={() => setShow(true)} className="w-full mt-4 bg-black hover:bg-black/90 h-11" data-testid="flashcard-show-btn">
          Mostra risposta
        </Button>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2">
          <Button variant="outline" onClick={() => review(1)} className="h-11 border-red-200 text-red-700 hover:bg-red-50" data-testid="fc-again">Di nuovo</Button>
          <Button variant="outline" onClick={() => review(3)} className="h-11" data-testid="fc-hard">Difficile</Button>
          <Button variant="outline" onClick={() => review(4)} className="h-11" data-testid="fc-good">Bene</Button>
          <Button onClick={() => review(5)} className="h-11 bg-black hover:bg-black/90" data-testid="fc-easy">Facile</Button>
        </div>
      )}
    </div>
  );
}

function Quiz({ material }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const quiz = material.quiz || [];

  const score = submitted ? quiz.reduce((s, q) => s + (answers[q.id] === q.correct_index ? 1 : 0), 0) : 0;

  const submit = async () => {
    setSubmitted(true);
    try {
      const payload = quiz.map((q) => ({ q: q.id, a: answers[q.id] ?? -1, correct: q.correct_index }));
      await api.post(`/materials/${material.id}/quiz/submit`, {
        material_id: material.id,
        score: quiz.reduce((s, q) => s + (answers[q.id] === q.correct_index ? 1 : 0), 0),
        total: quiz.length,
        answers: payload,
      });
      toast.success(`Risultato salvato`);
    } catch { /* ignore */ }
  };

  if (quiz.length === 0) return <p className="text-sm text-slate-500">Nessun quiz disponibile.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      {quiz.map((q, i) => (
        <div key={q.id} className="border border-slate-200 rounded-lg p-5 bg-white">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Domanda {i + 1}</div>
          <div className="font-heading text-lg mt-1.5 font-medium">{q.question}</div>
          <div className="mt-3 space-y-2">
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === oi;
              const correct = submitted && oi === q.correct_index;
              const wrong = submitted && selected && oi !== q.correct_index;
              return (
                <button
                  key={oi}
                  onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: oi }))}
                  className={`w-full text-left px-3 py-2.5 rounded-md border text-sm transition ${
                    correct ? "border-emerald-400 bg-emerald-50" :
                    wrong ? "border-red-300 bg-red-50" :
                    selected ? "border-slate-900 bg-slate-50" :
                    "border-slate-200 hover:bg-slate-50"
                  }`}
                  data-testid={`quiz-${q.id}-opt-${oi}`}
                >
                  <span className="inline-flex items-center gap-2">
                    {correct && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    {wrong && <X className="h-3.5 w-3.5 text-red-600" />}
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
          {submitted && q.explanation && (
            <div className="mt-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3">
              💡 {q.explanation}
            </div>
          )}
        </div>
      ))}
      {!submitted ? (
        <Button onClick={submit} className="bg-black hover:bg-black/90 h-11 px-6" data-testid="quiz-submit">
          Controlla risposte
        </Button>
      ) : (
        <div className="border border-slate-200 rounded-lg p-5 bg-[#FEF9C3] flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-600">Risultato</div>
            <div className="font-heading text-3xl font-semibold">{score} / {quiz.length}</div>
          </div>
          <Button variant="outline" onClick={() => { setAnswers({}); setSubmitted(false); }} data-testid="quiz-retry"><RotateCw className="h-4 w-4 mr-1.5" /> Riprova</Button>
        </div>
      )}
    </div>
  );
}

export default function MaterialView() {
  const { id } = useParams();
  const [mat, setMat] = useState(null);

  const load = async () => {
    const { data } = await api.get(`/materials/${id}`);
    setMat(data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (!mat) return <div className="text-slate-400 text-sm">Caricamento…</div>;

  return (
    <div className="space-y-6" data-testid="material-view">
      <Link to="/library" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900" data-testid="back-to-library">
        <ArrowLeft className="h-4 w-4" /> Libreria
      </Link>
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Materiale</div>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold">{mat.title}</h1>
        <p className="text-slate-500 text-sm mt-1">Creato il {new Date(mat.created_at).toLocaleDateString("it-IT")} • {mat.source_type.toUpperCase()}</p>
      </div>
      <Tabs defaultValue="summary">
        <TabsList className="bg-transparent border-b border-slate-200 rounded-none w-full justify-start gap-1 h-auto p-0">
          {[["summary","Riassunto"],["schema","Schema"],["flashcards","Flashcard"],["quiz","Quiz"],["exam","Domande esame"]].map(([v,l]) => (
            <TabsTrigger key={v} value={v} data-testid={`tab-${v}`} className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="summary" className="pt-6"><MDLite text={mat.summary} /></TabsContent>
        <TabsContent value="schema" className="pt-6"><MDLite text={mat.schema_outline} /></TabsContent>
        <TabsContent value="flashcards" className="pt-6"><FlashcardDeck material={mat} onUpdate={load} /></TabsContent>
        <TabsContent value="quiz" className="pt-6"><Quiz material={mat} /></TabsContent>
        <TabsContent value="exam" className="pt-6">
          <ol className="list-decimal pl-5 space-y-3 text-slate-800">
            {(mat.exam_questions || []).map((q, i) => <li key={i} className="leading-relaxed">{q}</li>)}
          </ol>
        </TabsContent>
      </Tabs>
      <MaterialChat materialId={mat.id} />
    </div>
  );
}
