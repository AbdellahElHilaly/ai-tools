import { BookOpenCheck, Layers3, RotateCcw } from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";

export function QuizSummary({ session, onLevels, onRetry }) {
  const score = Math.round((session.correctCount / session.questions.length) * 100);
  const message = score >= 80 ? "Excellent — you have a strong grasp of this level." : score >= 60 ? "Good work. Review the explanations and try again." : "A solid start. Take another pass when you are ready.";
  return (
    <Card className="mx-auto max-w-xl text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-secondary text-brand"><BookOpenCheck size={30} /></span>
      <span className="eyebrow mt-5 block">Level complete</span><h2 className="my-2 text-3xl font-black">{score}%</h2><p className="muted m-0 leading-7">{message}</p>
      <div className="my-7 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-secondary p-4"><strong className="block text-2xl text-brand">{session.correctCount}</strong><span className="text-sm">Correct</span></div><div className="rounded-2xl border border-accent p-4"><strong className="block text-2xl text-danger">{session.wrongCount}</strong><span className="text-sm">Incorrect</span></div></div>
      <div className="stack sm:grid sm:grid-cols-2"><Button variant="secondary" onClick={onRetry}><RotateCcw size={18} /> Retry level</Button><Button onClick={onLevels}><Layers3 size={18} /> Choose another level</Button></div>
    </Card>
  );
}
