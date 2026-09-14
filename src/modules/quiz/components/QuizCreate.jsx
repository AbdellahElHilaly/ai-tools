import { ArrowRight } from "lucide-react";
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
      <form className="stack gap-4" onSubmit={(event) => { event.preventDefault(); if (prompt.trim()) onSubmit({ prompt: prompt.trim(), saveToLibrary }); }}>
        <label className="stack gap-2"><span className="font-bold">What do you want to learn?</span><textarea className="min-h-28 resize-y rounded-xl border border-line bg-canvas p-4 leading-6 outline-none focus:border-brand" placeholder="Example: Teach me Java fundamentals" value={prompt} maxLength={1200} onChange={(e) => setPrompt(e.target.value)} autoFocus /></label>
        <div className="cluster">
          {examples.map((example) => <button type="button" key={example} className="rounded-full border border-line bg-transparent px-3 py-1.5 text-xs font-semibold text-muted hover:border-brand hover:text-brand" onClick={() => setPrompt(example)}>{example}</button>)}
        </div>
        <label className="flex cursor-pointer items-center gap-3 border-t border-line pt-4 text-sm font-semibold">
          <input type="checkbox" className="size-4 accent-[var(--color-brand)]" checked={saveToLibrary} onChange={(event) => setSaveToLibrary(event.target.checked)} />
          Save to My quizzes
        </label>
        <Button disabled={busy || prompt.trim().length < 5}>{busy ? "Creating…" : "Create quiz"}<ArrowRight size={18} /></Button>
      </form>
    </Card>
  );
}
