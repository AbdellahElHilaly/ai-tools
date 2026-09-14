import { BookOpenCheck, Layers3, RotateCcw } from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";

export function QuizSummary({ session, onLevels, onRetry }) {
  const score = Math.round((session.correctCount / session.questions.length) * 100);
  const message = score >= 80 ? "ممتاز، المستوى واضح عندك." : score >= 60 ? "مزيان، راجع الأخطاء وغادي تتحسن." : "بداية جيدة. عاود المستوى براحتك.";
  return (
    <Card className="mx-auto max-w-xl text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[var(--color-brand-soft)] text-brand"><BookOpenCheck size={30} /></span>
      <span className="eyebrow mt-5 block">اكتمل المستوى</span><h2 className="my-2 text-3xl font-black">{score}%</h2><p className="muted m-0 leading-7">{message}</p>
      <div className="my-7 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-emerald-50 p-4"><strong className="block text-2xl text-emerald-700">{session.correctCount}</strong><span className="text-sm">صحيحة</span></div><div className="rounded-2xl bg-red-50 p-4"><strong className="block text-2xl text-red-700">{session.wrongCount}</strong><span className="text-sm">خاطئة</span></div></div>
      <div className="stack sm:grid sm:grid-cols-2"><Button variant="secondary" onClick={onRetry}><RotateCcw size={18} /> عاود المستوى</Button><Button onClick={onLevels}><Layers3 size={18} /> اختار مستوى آخر</Button></div>
    </Card>
  );
}
