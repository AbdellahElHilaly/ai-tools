import { withTimeout } from "../../../core/network/asyncPolicy";
import { supabase } from "../../../core/supabase/client";

export class SmithAiError extends Error {
  constructor(message, { code = "SMITH_AI_ERROR", retryable = false } = {}) {
    super(message);
    this.name = "SmithAiError";
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

export const smithAiService = {
  async reply(sessionId) {
    const { data, error } = await withTimeout(
      supabase.functions.invoke("smith-chat", { body: { sessionId } }),
      65000,
      "The character took too long to answer. Please try again."
    );
    if (error) {
      const payload = await readFunctionError(error);
      const details = payload?.error;
      throw new SmithAiError(
        details?.message || error.message || "The character could not answer.",
        { code: details?.code || "FUNCTION_ERROR", retryable: details?.retryable ?? true }
      );
    }
    if (data?.error) {
      const details = typeof data.error === "string" ? { message: data.error } : data.error;
      throw new SmithAiError(details.message, { code: details.code, retryable: details.retryable });
    }
    return data?.data?.message;
  }
};
