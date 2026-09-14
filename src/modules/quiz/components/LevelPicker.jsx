import { ArrowRight, Check, Layers3 } from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";

export function LevelPicker({ quiz, selectedLevel, onSelect, onStart, busy }) {
  const selectedProgress = selectedLevel ? quiz.progressByLevel?.[selectedLevel.id] : null;
  const actionLabel = selectedProgress?.status === "completed"
    ? "View this level's result"
    : selectedProgress?.questions?.length
      ? "Continue where you left off"
      : "Start this level";

  return (
    <div className="stack gap-5">
      <Card className="border-secondary shadow-none">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">Step 2 of 3</span>
          <span className="text-xs font-bold text-brand">Choose one level</span>
        </div>
        <h2 className="mb-2 mt-2 text-2xl font-black">{quiz.title}</h2>
        <p className="muted m-0 leading-7">{quiz.description}</p>
      </Card>
      <div className="stack">
        {quiz.plan.levels.map((level, index) => {
          const active = selectedLevel?.id === level.id;
          const progress = quiz.progressByLevel?.[level.id];
          const answered = progress?.answers?.length || 0;
          const total = progress?.questions?.length || 0;
          const statusLabel = progress?.status === "completed" ? "Complete" : total ? `${answered}/${total}` : "Not started";
          return (
            <button key={level.id} type="button" aria-pressed={active} onClick={() => onSelect(level)} className={`grid w-full grid-cols-[auto_1fr_auto] items-start gap-4 rounded-2xl border bg-transparent p-4 text-left transition ${active ? "border-brand text-ink ring-2 ring-brand/10" : "border-line hover:border-brand/50"}`}>
              <span className={`grid size-10 place-items-center rounded-xl border font-black ${active ? "border-brand text-brand" : "border-line text-muted"}`}>{index + 1}</span>
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="block text-lg">{level.title}</strong>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${progress?.status === "completed" ? "border-secondary text-brand" : total ? "border-accent text-ink" : "border-line text-muted"}`}>{statusLabel}</span>
                </span>
                <span className="muted mt-1 block text-sm leading-6">{level.summary}</span>
                <span className="mt-3 flex flex-wrap gap-2">{level.topics.map((topic) => <span key={topic} className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold">{topic}</span>)}</span>
              </span>
              {active ? <Check className="text-brand" /> : <Layers3 className="text-muted" size={20} />}
            </button>
          );
        })}
      </div>
      <div className="sticky bottom-20 z-20">
        <Button size="lg" className="w-full" disabled={!selectedLevel || busy} onClick={onStart}>{busy ? "Preparing questions…" : actionLabel}<ArrowRight size={19} /></Button>
      </div>
    </div>
  );
}
