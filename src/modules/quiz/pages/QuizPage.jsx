import { useEffect, useReducer, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../core/supabase/AuthProvider";
import { quizAiService } from "../../../core/llm/quizAiService";
import { Button } from "../../../shared/components/Button";
import { ErrorNotice, LoadingState } from "../../../shared/components/Feedback";
import { LevelPicker } from "../components/LevelPicker";
import { QuestionCard } from "../components/QuestionCard";
import { QuizCreate } from "../components/QuizCreate";
import { QuizSummary } from "../components/QuizSummary";
import { initialQuizState, quizReducer, selectCurrentAnswer, selectCurrentQuestion } from "../domain/quizMachine";
import { quizRepository } from "../services/quizRepository";

export function QuizPage() {
  const [params, setParams] = useSearchParams();
  const { ensureSession } = useAuth();
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const loadedId = useRef(null);

  useEffect(() => {
    const id = params.get("id");
    if (!id || loadedId.current === id) return;
    loadedId.current = id;
    quizRepository.get(id).then((quiz) => quiz && dispatch({ type: "LOAD_QUIZ", quiz })).catch(() => setError("تعذر فتح هذا الكويز."));
  }, [params]);

  useEffect(() => {
    if (!state.quiz || state.phase === "create") return;
    const snapshot = { ...state.quiz, currentSession: state.session || {}, status: state.session?.status || "active" };
    const timer = window.setTimeout(() => quizRepository.save(snapshot).catch(() => undefined), 180);
    return () => window.clearTimeout(timer);
  }, [state.quiz, state.session, state.phase]);

  async function createPlan(prompt) {
    setBusy(true); setError("");
    try {
      await ensureSession();
      const plan = await quizAiService.createPlan({ prompt });
      const quiz = { id: crypto.randomUUID(), title: plan.title, description: plan.description, prompt, plan, currentSession: {}, activeLevelIndex: 0, status: "active", isSaved: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await quizRepository.save(quiz);
      setParams({ id: quiz.id });
      loadedId.current = quiz.id;
      dispatch({ type: "PLAN_READY", quiz });
    } catch (nextError) { setError(nextError.message); }
    finally { setBusy(false); }
  }

  async function startLevel() {
    setBusy(true); setError("");
    try {
      await ensureSession();
      const batch = await quizAiService.createQuestions({ prompt: state.quiz.prompt, level: state.selectedLevel });
      dispatch({ type: "QUESTIONS_READY", questions: batch.questions });
    } catch (nextError) { setError(nextError.message); }
    finally { setBusy(false); }
  }

  function restartLevel() {
    dispatch({ type: "SELECT_LEVEL", level: state.selectedLevel });
    startLevel();
  }

  const question = selectCurrentQuestion(state);
  const answer = selectCurrentAnswer(state);

  return (
    <div className="page stack gap-6">
      <header><span className="eyebrow">AI Quiz</span><h1 className="page-title">تعلّم على قدّ مستواك</h1>{state.phase === "create" ? <p className="page-copy">كتب الهدف، اختار المستوى، وجاوب. تقدمك كيتحفظ تلقائياً.</p> : null}</header>
      {error ? <div className="mx-auto w-full max-w-2xl stack"><ErrorNotice>{error}</ErrorNotice>{error.includes("تسجيل الدخول") ? <Link to="/config"><Button variant="secondary" className="w-full">فتح الإعدادات</Button></Link> : null}</div> : null}
      {busy && state.phase !== "create" ? <div className="surface"><LoadingState label={state.phase === "levels" ? "كنوجد أسئلة مناسبة…" : "كنحلل الموضوع ونبني المستويات…"} /></div> : null}
      {!busy && state.phase === "create" ? <QuizCreate onSubmit={createPlan} busy={busy} /> : null}
      {!busy && state.phase === "levels" ? <LevelPicker quiz={state.quiz} selectedLevel={state.selectedLevel} onSelect={(level) => dispatch({ type: "SELECT_LEVEL", level })} onStart={startLevel} busy={busy} /> : null}
      {!busy && state.phase === "playing" && question ? <QuestionCard session={state.session} question={question} answer={answer} onAnswer={(selectedIndex) => dispatch({ type: "ANSWER", selectedIndex })} onNext={() => dispatch({ type: "NEXT" })} /> : null}
      {!busy && state.phase === "summary" ? <QuizSummary session={state.session} onRetry={restartLevel} onLevels={() => dispatch({ type: "BACK_TO_LEVELS" })} /> : null}
    </div>
  );
}
