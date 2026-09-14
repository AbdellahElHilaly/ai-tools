import { supabase } from "../supabase/client";
import { questionBatchSchema, quizPlanSchema } from "./contracts";

async function invoke(body, schema) {
  const { data, error } = await supabase.functions.invoke("generate-quiz", { body });
  if (error) throw new Error(error.message || "تعذر الاتصال بخدمة الذكاء الاصطناعي.");
  if (data?.error) throw new Error(data.error);
  return schema.parse(data?.data);
}

export const quizAiService = {
  createPlan: ({ prompt, language = "ar" }) =>
    invoke({ operation: "plan", prompt, language }, quizPlanSchema),
  createQuestions: ({ prompt, level, language = "ar", questionCount = 8 }) =>
    invoke({ operation: "questions", prompt, level, language, questionCount }, questionBatchSchema)
};
