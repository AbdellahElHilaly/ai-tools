import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("../supabase/client", () => ({
  supabase: { functions: { invoke } }
}));

import { QuizAiError, quizAiService } from "./quizAiService";

const level = { id: "beginner", title: "Beginner", summary: "Fundamentals", topics: ["A", "B"] };

function questions(levelId = level.id) {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `q-${index}`,
    topic: "A",
    question: `Question ${index}`,
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    explanation: "Explanation"
  })).map((question) => ({ ...question, levelId }));
}

describe("quiz AI service", () => {
  beforeEach(() => invoke.mockReset());

  it("returns a validated question batch", async () => {
    invoke.mockResolvedValue({ data: { data: { levelId: level.id, questions: questions() } }, error: null });
    const result = await quizAiService.createQuestions({ prompt: "Learn Java", level, questionCount: 4 });
    expect(result.questions).toHaveLength(4);
  });

  it("surfaces the structured server error and retry hint", async () => {
    const payload = { error: { code: "AI_BUSY", message: "The AI service is busy.", retryable: true } };
    invoke.mockResolvedValue({ data: null, error: { context: new Response(JSON.stringify(payload), { status: 429 }) } });

    await expect(quizAiService.createPlan({ prompt: "Learn Java" })).rejects.toMatchObject({
      name: "QuizAiError",
      code: "AI_BUSY",
      retryable: true
    });
  });

  it("rejects questions generated for another level", async () => {
    invoke.mockResolvedValue({ data: { data: { levelId: "advanced", questions: questions() } }, error: null });
    await expect(quizAiService.createQuestions({ prompt: "Learn Java", level, questionCount: 4 })).rejects.toBeInstanceOf(QuizAiError);
  });
});
