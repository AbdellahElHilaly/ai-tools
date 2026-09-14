import { ArrowRight, CheckCircle2, Layers3, XCircle } from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { MarkdownContent } from "../../../shared/components/MarkdownContent";

export function QuestionCard({ session, question, answer, onAnswer, onNext, onExit }) {
  const progress = Math.round(((session.currentIndex + 1) / session.questions.length) * 100);
  return (
    <div className="mx-auto max-w-2xl stack gap-3">
      <div className="flex items-center justify-between gap-3"><button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-transparent px-2 text-sm font-semibold text-muted hover:border-line hover:text-ink" onClick={onExit}><Layers3 size={17} /> Levels</button><span className="text-sm font-semibold">{session.currentIndex + 1} of {session.questions.length}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-accent"><span className="block h-full bg-brand transition-all" style={{ width: `${progress}%` }} /></div>
      <Card className="stack gap-5">
        <div><span className="eyebrow">{question.topic}</span><h2 className="mb-0 mt-2 text-lg font-black leading-7 sm:text-xl">{question.question}</h2></div>
        <div className="stack gap-2" role="group" aria-label="Answer options">
          {question.options.map((option, index) => {
            const selected = answer?.selectedIndex === index;
            const correct = answer && question.correctIndex === index;
            const wrong = selected && !correct;
            return <button key={option} type="button" disabled={Boolean(answer)} onClick={() => onAnswer(index)} className={`flex min-h-12 items-center gap-3 rounded-xl border bg-transparent p-3 text-left text-sm font-semibold transition-colors ${correct ? "border-secondary text-brand" : wrong ? "border-danger text-danger" : selected ? "border-brand" : "border-line hover:border-brand"}`}><span className={`grid size-8 shrink-0 place-items-center rounded-lg border text-sm ${selected || correct ? "border-brand text-brand" : "border-line"}`}>{String.fromCharCode(65 + index)}</span><span>{option}</span>{correct ? <CheckCircle2 className="ml-auto shrink-0" size={20} /> : wrong ? <XCircle className="ml-auto shrink-0" size={20} /> : null}</button>;
          })}
        </div>
        {answer ? <div className={`rounded-xl border p-3 ${answer.isCorrect ? "border-secondary" : "border-accent"}`}><strong className="mb-1 block text-sm">{answer.isCorrect ? "Correct" : "Explanation"}</strong><MarkdownContent>{question.explanation}</MarkdownContent></div> : null}
        {answer ? <Button onClick={onNext}>{session.currentIndex === session.questions.length - 1 ? "View result" : "Next question"}<ArrowRight size={18} /></Button> : null}
      </Card>
    </div>
  );
}
