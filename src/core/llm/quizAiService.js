import { supabase } from "../supabase/client";
import { questionBatchSchema, quizPlanSchema } from "./contracts";

export class QuizAiError extends Error {
  constructor(message, { code = "AI_ERROR", retryable = false } = {}) {
    super(message);
    this.name = "QuizAiError";
    this.code = code;
    this.retryable = retryable;
  }
}

async function readFunctionError(error) {
  const response = error?.context;
  if (!response || typeof response.clone !== "function") return null;
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

async function invoke(body, schema) {
  const { data, error } = await supabase.functions.invoke("generate-quiz", { body });
  if (error) {
    const payload = await readFunctionError(error);
    const details = payload?.error;
    throw new QuizAiError(
      details?.message || error.message || "Could not connect to the AI service.",
      { code: details?.code || "FUNCTION_ERROR", retryable: details?.retryable ?? true }
    );
  }
  if (data?.error) {
    const details = typeof data.error === "string" ? { message: data.error } : data.error;
    throw new QuizAiError(details.message, { code: details.code, retryable: details.retryable });
  }

  const result = schema.safeParse(data?.data);
  if (!result.success) {
    throw new QuizAiError("The AI returned an incomplete response. Please try again.", { code: "INVALID_RESPONSE", retryable: true });
  }
  return result.data;
}

export const quizAiService = {
  createPlan: ({ prompt, language = "en" }) =>
    invoke({ operation: "plan", prompt, language }, quizPlanSchema),
  createQuestions: async ({ prompt, level, language = "en", questionCount = 8 }) => {
    const batch = await invoke({ operation: "questions", prompt, level, language, questionCount }, questionBatchSchema);
    if (batch.levelId !== level.id) {
      throw new QuizAiError("The questions do not match the selected level. Please try again.", { code: "LEVEL_MISMATCH", retryable: true });
    }
    return batch;
  }
};
