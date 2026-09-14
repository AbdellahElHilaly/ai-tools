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
        else setError({ message: "We could not find this quiz. It may have been deleted or not synced yet.", code: "NOT_FOUND" });
      })
      .catch(() => active && setError({ message: "We could not open this quiz.", code: "LOAD_FAILED", retryable: true }))
      .finally(() => active && setOperation(null));
    return () => { active = false; };
  }, [params]);

  function showError(nextError, retryAction) {
    setError({
      message: nextError?.message || "Something unexpected happened. Please try again.",
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
    <div className="page stack gap-4">
      {state.phase === "create" ? <header><h1 className="page-title">Quiz</h1><p className="page-copy text-sm">Create a quiz from any topic.</p></header> : null}
      {state.quiz ? <div className="mx-auto w-full max-w-2xl"><SaveStatus status={autosave.status} error={autosave.error} onRetry={autosave.retry} onSave={saveToLibrary} /></div> : null}
      {error ? <div className="mx-auto w-full max-w-2xl stack"><ErrorNotice>{error.message}</ErrorNotice><div className="cluster">{error.code === "AUTH_REQUIRED" ? <Link className="flex-1" to="/config?next=/quiz"><Button variant="secondary" className="w-full">Sign in</Button></Link> : null}{error.retryable && error.retryAction === "questions" ? <Button className="flex-1" onClick={() => startLevel({ force: true })}>Try again</Button> : null}</div></div> : null}
      {operation === "loading" ? <div className="surface"><LoadingState label="Loading your quiz and progress…" /></div> : null}
      {authLoading && state.phase === "create" ? <div className="surface"><LoadingState label="Checking your account…" /></div> : null}
      {!authLoading && !user && state.phase === "create" ? <div className="surface mx-auto w-full max-w-2xl p-5 text-center stack"><h2 className="m-0 text-lg font-black">Sign in to create a quiz</h2><Link to="/config?next=/quiz"><Button className="w-full">Open account</Button></Link></div> : null}
      {!authLoading && user && state.phase === "create" && operation !== "loading" ? <QuizCreate onSubmit={createPlan} busy={operation === "planning"} /> : null}
      {operation === "generating" ? <div className="surface"><LoadingState label="Preparing questions for this level…" /></div> : null}
      {!busy && state.phase === "levels" ? <LevelPicker quiz={state.quiz} selectedLevel={state.selectedLevel} onSelect={(level) => dispatch({ type: "SELECT_LEVEL", level })} onStart={() => startLevel()} busy={busy} /> : null}
      {!busy && state.phase === "playing" && question ? <QuestionCard session={state.session} question={question} answer={answer} onAnswer={(selectedIndex) => dispatch({ type: "ANSWER", selectedIndex })} onNext={() => dispatch({ type: "NEXT" })} onExit={() => dispatch({ type: "BACK_TO_LEVELS" })} /> : null}
      {!busy && state.phase === "summary" ? <QuizSummary session={state.session} onRetry={restartLevel} onLevels={() => dispatch({ type: "BACK_TO_LEVELS" })} /> : null}
    </div>
  );
}
