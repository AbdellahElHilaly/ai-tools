import { ArrowRight, WandSparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { LoadingState } from "../../../shared/components/Feedback";

const examples = ["Teach me Java fundamentals", "Test my cybersecurity knowledge", "Help me learn databases from scratch"];

export function QuizCreate({ onSubmit, busy }) {
  const [prompt, setPrompt] = useState("");
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  if (busy) {
    return (
      <Card className="mx-auto max-w-2xl" aria-busy="true">
        <LoadingState label="Analyzing your goal and building clear levels…" />
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <form className="stack gap-5" onSubmit={(event) => { event.preventDefault(); if (prompt.trim()) onSubmit({ prompt: prompt.trim(), saveToLibrary }); }}>
        <div className="flex items-center justify-between gap-3"><span className="eyebrow">Step 1 of 3</span><span className="muted text-xs">Goal → level → questions</span></div>
        <label className="stack gap-2"><span className="text-lg font-black">What would you like to learn?</span><span className="muted text-sm">Describe your goal in your own words. AI will turn it into a clear learning path.</span><textarea className="min-h-36 resize-y rounded-2xl border border-line bg-canvas p-4 leading-7 outline-none focus:border-brand" placeholder="Example: Teach me Java from the basics through object-oriented programming…" value={prompt} maxLength={1200} onChange={(e) => setPrompt(e.target.value)} autoFocus /></label>
        <div className="cluster">
          {examples.map((example) => <button type="button" key={example} className="rounded-full border border-line bg-transparent px-3 py-2 text-xs font-bold hover:border-brand hover:text-brand" onClick={() => setPrompt(example)}>{example}</button>)}
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-canvas p-4">
          <input type="checkbox" className="mt-1 size-4 accent-[var(--color-brand)]" checked={saveToLibrary} onChange={(event) => setSaveToLibrary(event.target.checked)} />
          <span><strong className="block text-sm">Save to my quizzes</strong><span className="muted mt-1 block text-xs leading-5">Continue any level later, including on another device while signed in.</span></span>
        </label>
        <Button size="lg" disabled={busy || prompt.trim().length < 5}><WandSparkles size={20} /> {busy ? "Building your path…" : "Suggest levels"}<ArrowRight size={18} /></Button>
      </form>
    </Card>
  );
}
