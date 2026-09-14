import { ArrowLeft, Check, Layers3 } from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";

export function LevelPicker({ quiz, selectedLevel, onSelect, onStart, busy }) {
  const selectedProgress = selectedLevel ? quiz.progressByLevel?.[selectedLevel.id] : null;
  const actionLabel = selectedProgress?.status === "completed"
    ? "شوف نتيجة هذا المستوى"
    : selectedProgress?.questions?.length
      ? "كمّل من فين وقفتي"
      : "ابدأ هذا المستوى";

  return (
    <div className="stack gap-5">
      <Card className="border-brand/30 bg-[var(--color-brand-soft)] shadow-none">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">الخطوة 2 من 3</span>
          <span className="text-xs font-bold text-emerald-900">اختار مستوى واحد</span>
        </div>
        <h2 className="mb-2 mt-2 text-2xl font-black">{quiz.title}</h2>
        <p className="m-0 leading-7 text-emerald-900">{quiz.description}</p>
      </Card>
      <div className="stack">
        {quiz.plan.levels.map((level, index) => {
          const active = selectedLevel?.id === level.id;
          const progress = quiz.progressByLevel?.[level.id];
          const answered = progress?.answers?.length || 0;
          const total = progress?.questions?.length || 0;
          const statusLabel = progress?.status === "completed" ? "مكتمل" : total ? `${answered}/${total}` : "ما بداش";
          return (
            <button key={level.id} type="button" aria-pressed={active} onClick={() => onSelect(level)} className={`surface grid w-full grid-cols-[auto_1fr_auto] items-start gap-4 p-4 text-right transition ${active ? "border-brand ring-2 ring-brand/10" : "hover:border-brand/50"}`}>
              <span className={`grid size-10 place-items-center rounded-xl font-black ${active ? "bg-brand text-white" : "bg-black/5"}`}>{index + 1}</span>
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="block text-lg">{level.title}</strong>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${progress?.status === "completed" ? "bg-emerald-100 text-emerald-800" : total ? "bg-amber-100 text-amber-900" : "bg-black/5 text-muted"}`}>{statusLabel}</span>
                </span>
                <span className="muted mt-1 block text-sm leading-6">{level.summary}</span>
                <span className="mt-3 flex flex-wrap gap-2">{level.topics.map((topic) => <span key={topic} className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold">{topic}</span>)}</span>
              </span>
              {active ? <Check className="text-brand" /> : <Layers3 className="text-muted" size={20} />}
            </button>
          );
        })}
      </div>
      <div className="sticky bottom-20 z-20 sm:bottom-4">
        <Button size="lg" className="w-full shadow-xl" disabled={!selectedLevel || busy} onClick={onStart}>{busy ? "كنوجد الأسئلة…" : actionLabel}<ArrowLeft size={19} /></Button>
      </div>
    </div>
  );
}
