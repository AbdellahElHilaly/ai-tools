import { ArrowLeft, WandSparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";

const examples = ["علّمني أساسيات Java", "اختبرني في الأمن المعلوماتي", "بغيت نتعلم قواعد البيانات من الصفر"];

export function QuizCreate({ onSubmit, busy }) {
  const [prompt, setPrompt] = useState("");
  return (
    <Card className="mx-auto max-w-2xl">
      <form className="stack gap-5" onSubmit={(event) => { event.preventDefault(); if (prompt.trim()) onSubmit(prompt.trim()); }}>
        <label className="stack gap-2"><span className="text-lg font-black">شنو بغيتي تتعلم؟</span><span className="muted text-sm">كتب الهدف بطريقتك، والذكاء الاصطناعي يقسمه لمستويات واضحة.</span><textarea className="min-h-36 resize-y rounded-2xl border border-line bg-canvas p-4 leading-7 outline-none focus:border-brand" placeholder="مثال: بغيت نتعلم Java من الصفر حتى نفهم البرمجة الكائنية…" value={prompt} maxLength={1200} onChange={(e) => setPrompt(e.target.value)} autoFocus /></label>
        <div className="cluster">
          {examples.map((example) => <button type="button" key={example} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-bold hover:border-brand" onClick={() => setPrompt(example)}>{example}</button>)}
        </div>
        <Button size="lg" disabled={busy || prompt.trim().length < 5}><WandSparkles size={20} /> {busy ? "كنوجد المسار…" : "اقترح المستويات"}<ArrowLeft size={18} /></Button>
      </form>
    </Card>
  );
}
