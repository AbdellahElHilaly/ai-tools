import { ArrowLeft, Check, Layers3 } from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";

export function LevelPicker({ quiz, selectedLevel, onSelect, onStart, busy }) {
  return (
    <div className="stack gap-5">
      <Card className="border-brand/30 bg-[var(--color-brand-soft)] shadow-none"><span className="eyebrow">المسار ديالك</span><h2 className="mb-2 mt-2 text-2xl font-black">{quiz.title}</h2><p className="m-0 leading-7 text-emerald-900">{quiz.description}</p></Card>
      <div className="stack">
        {quiz.plan.levels.map((level, index) => {
          const active = selectedLevel?.id === level.id;
          return (
            <button key={level.id} onClick={() => onSelect(level)} className={`surface grid w-full grid-cols-[auto_1fr_auto] items-start gap-4 p-4 text-right transition ${active ? "border-brand ring-2 ring-brand/10" : "hover:border-brand/50"}`}>
              <span className={`grid size-10 place-items-center rounded-xl font-black ${active ? "bg-brand text-white" : "bg-black/5"}`}>{index + 1}</span>
              <span><strong className="block text-lg">{level.title}</strong><span className="muted mt-1 block text-sm leading-6">{level.summary}</span><span className="mt-3 flex flex-wrap gap-2">{level.topics.map((topic) => <span key={topic} className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold">{topic}</span>)}</span></span>
              {active ? <Check className="text-brand" /> : <Layers3 className="text-muted" size={20} />}
            </button>
          );
        })}
      </div>
      <div className="sticky bottom-20 z-20 sm:bottom-4"><Button size="lg" className="w-full shadow-xl" disabled={!selectedLevel || busy} onClick={onStart}>{busy ? "كنوجد الأسئلة…" : "ابدأ هذا المستوى"}<ArrowLeft size={19} /></Button></div>
    </div>
  );
}
