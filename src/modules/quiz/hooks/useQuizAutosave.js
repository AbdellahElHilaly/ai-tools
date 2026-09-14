import { useCallback, useEffect, useState } from "react";
import { quizRepository } from "../services/quizRepository";

export function useQuizAutosave(quiz) {
  const [status, setStatus] = useState(quiz?.isSaved ? "idle" : "unsaved");
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!quiz?.isSaved) {
      setStatus("unsaved");
      setError("");
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setStatus("saving");
      setError("");
      try {
        await quizRepository.save(quiz);
        if (active) setStatus("saved");
      } catch {
        if (active) {
          setStatus("error");
          setError("تحفظ محلياً، ولكن المزامنة مع الحساب ما نجحاتش.");
        }
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [quiz, retryToken]);

  const retry = useCallback(() => setRetryToken((value) => value + 1), []);
  return { status, error, retry };
}
