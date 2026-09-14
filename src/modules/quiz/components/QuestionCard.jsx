import { ArrowRight, CheckCircle2, Layers3, XCircle } from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { MarkdownContent } from "../../../shared/components/MarkdownContent";

export function QuestionCard({ session, question, answer, onAnswer, onNext, onExit }) {
  const progress = Math.round(((session.currentIndex + 1) / session.questions.length) * 100);
  return (
    <div className="mx-auto max-w-2xl stack gap-4">
      <div className="flex items-center justify-between gap-3"><button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-transparent px-3 text-sm font-bold text-muted hover:border-line hover:text-ink" onClick={onExit}><Layers3 size={17} /> Levels</button><span className="eyebrow">Step 3 of 3</span></div>
      <div className="flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-accent"><span className="block h-full bg-brand transition-all" style={{ width: `${progress}%` }} /></div><strong className="text-sm">{session.currentIndex + 1}/{session.questions.length}</strong></div>
      <Card className="stack gap-6">
        <div><span className="eyebrow">{question.topic}</span><h2 className="mb-0 mt-3 text-xl font-black leading-8 sm:text-2xl">{question.question}</h2></div>
        <div className="stack gap-3" role="group" aria-label="Answer options">
          {question.options.map((option, index) => {
            const selected = answer?.selectedIndex === index;
            const correct = answer && question.correctIndex === index;
            const wrong = selected && !correct;
            return <button key={option} type="button" disabled={Boolean(answer)} onClick={() => onAnswer(index)} className={`flex min-h-14 items-center gap-3 rounded-2xl border bg-transparent p-4 text-left font-semibold transition ${correct ? "border-secondary text-brand" : wrong ? "border-danger text-danger" : selected ? "border-brand" : "border-line hover:border-brand"}`}><span className={`grid size-8 shrink-0 place-items-center rounded-lg border text-sm ${selected || correct ? "border-brand text-brand" : "border-line"}`}>{String.fromCharCode(65 + index)}</span><span>{option}</span>{correct ? <CheckCircle2 className="ml-auto shrink-0" size={20} /> : wrong ? <XCircle className="ml-auto shrink-0" size={20} /> : null}</button>;
          })}
        </div>
        {answer ? <div className={`rounded-2xl border p-4 ${answer.isCorrect ? "border-secondary" : "border-accent"}`}><strong className="mb-1 block">{answer.isCorrect ? "Correct — nicely done!" : "Not quite. Here is why:"}</strong><MarkdownContent>{question.explanation}</MarkdownContent></div> : null}
        {answer ? <Button size="lg" onClick={onNext}>{session.currentIndex === session.questions.length - 1 ? "View result" : "Next question"}<ArrowRight size={18} /></Button> : null}
      </Card>
    </div>
  );
}
