import { useEffect, useReducer, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../core/supabase/AuthProvider";
import { quizAiService } from "../../../core/llm/quizAiService";
import { Button } from "../../../shared/components/Button";
import { ErrorNotice, LoadingState } from "../../../shared/components/Feedback";
import { LevelPicker } from "../components/LevelPicker";
import { QuestionCard } from "../components/QuestionCard";
import { QuizCreate } from "../components/QuizCreate";
import { SaveStatus } from "../components/SaveStatus";
import { QuizSummary } from "../components/QuizSummary";
import { initialQuizState, quizReducer, selectCurrentAnswer, selectCurrentQuestion } from "../domain/quizMachine";
import { useQuizAutosave } from "../hooks/useQuizAutosave";
import { quizRepository } from "../services/quizRepository";

export function QuizPage() {
  const [params, setParams] = useSearchParams();
  const { ensureSession, user, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);
  const [operation, setOperation] = useState(null);
  const [error, setError] = useState(null);
  const loadedId = useRef(null);
  const autosave = useQuizAutosave(state.quiz);
  const busy = Boolean(operation);

  useEffect(() => {
    const id = params.get("id");
    if (!id || loadedId.current === id) return;
    let active = true;
    loadedId.current = id;
    setOperation("loading");
    quizRepository.get(id)
      .then((quiz) => {
        if (!active) return;
        if (quiz) dispatch({ type: "LOAD_QUIZ", quiz });
        else setError({ message: "ما لقيناش هذا الكويز. ممكن يكون تحذف أو ما تزامنش بعد.", code: "NOT_FOUND" });
      })
      .catch(() => active && setError({ message: "تعذر فتح هذا الكويز.", code: "LOAD_FAILED", retryable: true }))
      .finally(() => active && setOperation(null));
    return () => { active = false; };
  }, [params]);

  function showError(nextError, retryAction) {
    setError({
      message: nextError?.message || "وقع خطأ غير متوقع. حاول مرة أخرى.",
      code: nextError?.code || "UNKNOWN",
      retryable: Boolean(nextError?.retryable),
      retryAction
    });
  }

  async function createPlan({ prompt, saveToLibrary }) {
    setOperation("planning"); setError(null);
    try {
      await ensureSession();
      const plan = await quizAiService.createPlan({ prompt });
      const now = new Date().toISOString();
      const quiz = { id: crypto.randomUUID(), title: plan.title, description: plan.description, prompt, plan, currentSession: {}, progressByLevel: {}, activeLevelIndex: 0, status: "active", isSaved: saveToLibrary, createdAt: now, updatedAt: now };
      if (saveToLibrary) setParams({ id: quiz.id });
      loadedId.current = quiz.id;
      dispatch({ type: "PLAN_READY", quiz });
    } catch (nextError) { showError(nextError, "plan"); }
    finally { setOperation(null); }
  }

  async function startLevel({ force = false } = {}) {
    const savedSession = state.quiz.progressByLevel?.[state.selectedLevel?.id];
    if (!force && savedSession?.questions?.length) {
      dispatch({ type: "OPEN_LEVEL", level: state.selectedLevel });
      return;
    }

    setOperation("generating"); setError(null);
    try {
      await ensureSession();
      const batch = await quizAiService.createQuestions({ prompt: state.quiz.prompt, level: state.selectedLevel });
      dispatch({ type: "QUESTIONS_READY", questions: batch.questions });
    } catch (nextError) { showError(nextError, "questions"); }
    finally { setOperation(null); }
  }

  function restartLevel() {
    startLevel({ force: true });
  }

  function saveToLibrary() {
    dispatch({ type: "SAVE_TO_LIBRARY" });
    setParams({ id: state.quiz.id });
    loadedId.current = state.quiz.id;
  }

  const question = selectCurrentQuestion(state);
  const answer = selectCurrentAnswer(state);

  return (
    <div className="page stack gap-6">
      <header><span className="eyebrow">AI Quiz</span><h1 className="page-title">تعلّم على قدّ مستواك</h1>{state.phase === "create" ? <p className="page-copy">كتب الهدف، اختار المستوى، وجاوب. تقدمك كيتحفظ تلقائياً.</p> : null}</header>
      {state.quiz ? <div className="mx-auto w-full max-w-2xl"><SaveStatus status={autosave.status} error={autosave.error} onRetry={autosave.retry} onSave={saveToLibrary} /></div> : null}
      {error ? <div className="mx-auto w-full max-w-2xl stack"><ErrorNotice>{error.message}</ErrorNotice><div className="cluster">{error.code === "AUTH_REQUIRED" ? <Link className="flex-1" to="/config?next=/quiz"><Button variant="secondary" className="w-full">سجّل الدخول</Button></Link> : null}{error.retryable && error.retryAction === "questions" ? <Button className="flex-1" onClick={() => startLevel({ force: true })}>عاود المحاولة</Button> : null}</div></div> : null}
      {operation === "loading" ? <div className="surface"><LoadingState label="كنجيب الكويز والتقدم ديالك…" /></div> : null}
      {authLoading && state.phase === "create" ? <div className="surface"><LoadingState label="كنتحقق من الحساب…" /></div> : null}
      {!authLoading && !user && state.phase === "create" ? <div className="surface mx-auto max-w-2xl p-6 text-center stack"><h2 className="m-0 text-xl font-black">دخل لحسابك باش تبدأ</h2><p className="muted m-0 leading-7">هكذا الأسئلة والتقدم ديالك يبقاو محفوظين ومتوفرين من أي جهاز.</p><Link to="/config?next=/quiz"><Button className="w-full">دخول أو إنشاء حساب</Button></Link></div> : null}
      {!authLoading && user && state.phase === "create" && operation !== "loading" ? <QuizCreate onSubmit={createPlan} busy={operation === "planning"} /> : null}
      {operation === "generating" ? <div className="surface"><LoadingState label="كنوجد أسئلة مناسبة لهذا المستوى…" /></div> : null}
      {!busy && state.phase === "levels" ? <LevelPicker quiz={state.quiz} selectedLevel={state.selectedLevel} onSelect={(level) => dispatch({ type: "SELECT_LEVEL", level })} onStart={() => startLevel()} busy={busy} /> : null}
      {!busy && state.phase === "playing" && question ? <QuestionCard session={state.session} question={question} answer={answer} onAnswer={(selectedIndex) => dispatch({ type: "ANSWER", selectedIndex })} onNext={() => dispatch({ type: "NEXT" })} onExit={() => dispatch({ type: "BACK_TO_LEVELS" })} /> : null}
      {!busy && state.phase === "summary" ? <QuizSummary session={state.session} onRetry={restartLevel} onLevels={() => dispatch({ type: "BACK_TO_LEVELS" })} /> : null}
    </div>
  );
}
