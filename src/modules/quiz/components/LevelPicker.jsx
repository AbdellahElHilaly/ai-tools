import { ArrowRight, Check } from "lucide-react";
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
    <div className="mx-auto w-full max-w-2xl stack gap-4">
      <Card className="shadow-none">
        <h2 className="mb-1 mt-0 text-xl font-black">{quiz.title}</h2>
        <p className="muted m-0 text-sm leading-6">{quiz.description}</p>
      </Card>
      <h3 className="m-0 text-sm font-bold">Choose a level</h3>
      <div className="stack gap-2">
        {quiz.plan.levels.map((level, index) => {
          const active = selectedLevel?.id === level.id;
          const progress = quiz.progressByLevel?.[level.id];
          const answered = progress?.answers?.length || 0;
          const total = progress?.questions?.length || 0;
          const statusLabel = progress?.status === "completed" ? "Complete" : total ? `${answered}/${total}` : "Not started";
          return (
            <button key={level.id} type="button" aria-pressed={active} onClick={() => onSelect(level)} className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border bg-transparent p-3 text-left transition-colors ${active ? "border-brand text-ink" : "border-line hover:border-brand/50"}`}>
              <span className={`grid size-9 place-items-center rounded-lg border text-sm font-black ${active ? "border-brand text-brand" : "border-line text-muted"}`}>{index + 1}</span>
              <span className="min-w-0">
                <strong className="block">{level.title}</strong>
                <span className="muted mt-0.5 block text-sm leading-5">{level.summary}</span>
              </span>
              <span className="flex flex-col items-end gap-1 text-xs font-semibold text-muted"><span>{statusLabel}</span>{active ? <Check className="text-brand" size={18} /> : null}</span>
            </button>
          );
        })}
      </div>
      <div className="sticky bottom-16 z-20 bg-canvas py-2">
        <Button className="w-full" disabled={!selectedLevel || busy} onClick={onStart}>{busy ? "Preparing…" : actionLabel}<ArrowRight size={18} /></Button>
      </div>
    </div>
  );
}
