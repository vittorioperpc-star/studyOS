import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";

export default function UploadDialog({ open, onOpenChange, onCreated }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Seleziona un file");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (title) form.append("title", title);
      toast.info("Analisi in corso… (può richiedere 20-40 sec)");
      const { data } = await api.post("/materials/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
      });
      toast.success("Materiale creato!");
      setTitle(""); setFile(null);
      onCreated?.(data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Errore durante l'upload");
    } finally { setLoading(false); }
  };

  const submitText = async (e) => {
    e.preventDefault();
    if (text.trim().length < 30) return toast.error("Testo troppo corto");
    setLoading(true);
    try {
      toast.info("Analisi in corso…");
      const { data } = await api.post("/materials/text", { title: title || "Testo incollato", text }, { timeout: 180000 });
      toast.success("Materiale creato!");
      setTitle(""); setText("");
      onCreated?.(data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Errore");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Nuovo materiale</DialogTitle>
          <DialogDescription>Carica PDF / foto di appunti oppure incolla del testo.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="file">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" data-testid="tab-file"><Upload className="h-3.5 w-3.5 mr-1.5" /> File</TabsTrigger>
            <TabsTrigger value="text" data-testid="tab-text"><FileText className="h-3.5 w-3.5 mr-1.5" /> Testo</TabsTrigger>
          </TabsList>
          <TabsContent value="file">
            <form onSubmit={uploadFile} className="space-y-3 pt-3">
              <div>
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Titolo (opzionale)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Storia - Capitolo 3" className="mt-1.5 h-10" data-testid="upload-title-input" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">File (PDF, JPG, PNG)</Label>
                <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1.5 h-10" data-testid="upload-file-input" />
                {file && <div className="text-xs text-slate-500 mt-1">{file.name} — {(file.size/1024).toFixed(0)} KB</div>}
              </div>
              <Button type="submit" disabled={loading} className="w-full h-10 bg-black hover:bg-black/90" data-testid="upload-submit-btn">
                {loading ? "Analisi…" : "Carica e genera"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="text">
            <form onSubmit={submitText} className="space-y-3 pt-3">
              <div>
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Titolo</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 h-10" data-testid="text-title-input" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">Testo</Label>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Incolla qui i tuoi appunti…" className="mt-1.5" data-testid="text-content-input" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-10 bg-black hover:bg-black/90" data-testid="text-submit-btn">
                {loading ? "Analisi…" : "Genera"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
