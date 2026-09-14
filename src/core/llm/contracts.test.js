import { describe, expect, it } from "vitest";
import { questionBatchSchema, quizPlanSchema } from "./contracts";

describe("LLM contracts", () => {
  it("accepts a valid quiz plan", () => {
    const plan = {
      title: "Java",
      description: "مسار Java",
      levels: [
        { id: "beginner", title: "مبتدئ", summary: "الأساسيات", topics: ["المتغيرات", "الشروط"] },
        { id: "advanced", title: "متقدم", summary: "التصميم", topics: ["OOP", "Patterns"] }
      ]
    };
    expect(quizPlanSchema.parse(plan)).toEqual(plan);
  });

  it("rejects a question without four options", () => {
    const batch = {
      levelId: "beginner",
      questions: Array.from({ length: 4 }, (_, index) => ({
        id: `q-${index}`,
        topic: "Java",
        question: "سؤال",
        options: ["A", "B"],
        correctIndex: 0,
        explanation: "شرح"
      }))
    };
    expect(() => questionBatchSchema.parse(batch)).toThrow();
  });
});
