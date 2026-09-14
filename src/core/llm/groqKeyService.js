import { supabase } from "../supabase/client";

export class GroqKeyError extends Error {
  constructor(message, { code = "GROQ_KEY_ERROR", retryable = false } = {}) {
    super(message);
    this.name = "GroqKeyError";
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

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke("manage-groq-keys", { body });
  if (error) {
    const payload = await readFunctionError(error);
    const details = payload?.error;
    throw new GroqKeyError(
      details?.message || error.message || "تعذر الاتصال بخدمة مفاتيح Groq.",
      { code: details?.code || "FUNCTION_ERROR", retryable: details?.retryable ?? true }
    );
  }
  if (data?.error) {
    const details = typeof data.error === "string" ? { message: data.error } : data.error;
    throw new GroqKeyError(details.message, { code: details.code, retryable: details.retryable });
  }
  return data?.data;
}

export const groqKeyService = {
  list: async () => (await invoke({ operation: "list" }))?.keys || [],
  save: ({ label, apiKey }) => invoke({ operation: "save", label, apiKey }),
  testDraft: async ({ apiKey }) => {
    const result = await invoke({ operation: "test", apiKey });
    if (!result.valid) throw new GroqKeyError(result.message, { code: "INVALID_KEY" });
    return result;
  },
  testSaved: async ({ keyId }) => {
    const result = await invoke({ operation: "test", keyId });
    if (!result.valid) throw new GroqKeyError(result.message, { code: "INVALID_KEY" });
    return result;
  },
  remove: ({ keyId }) => invoke({ operation: "delete", keyId })
};
