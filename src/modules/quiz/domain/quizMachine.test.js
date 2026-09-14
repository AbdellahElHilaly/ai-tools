import { describe, expect, it } from "vitest";
import { initialQuizState, quizReducer, selectCurrentAnswer } from "./quizMachine";

const quiz = {
  plan: { levels: [{ id: "one", title: "الأول", summary: "", topics: ["A", "B"] }] },
  currentSession: {}
};
const questions = [
  { id: "q1", correctIndex: 1, options: ["A", "B", "C", "D"] },
  { id: "q2", correctIndex: 0, options: ["A", "B", "C", "D"] }
];

describe("quiz state machine", () => {
  it("moves from plan to a completed session and scores once", () => {
    let state = quizReducer(initialQuizState, { type: "PLAN_READY", quiz });
    state = quizReducer(state, { type: "SELECT_LEVEL", level: quiz.plan.levels[0] });
    state = quizReducer(state, { type: "QUESTIONS_READY", questions });
    state = quizReducer(state, { type: "ANSWER", selectedIndex: 1 });
    state = quizReducer(state, { type: "ANSWER", selectedIndex: 0 });
    expect(state.session.correctCount).toBe(1);
    expect(state.session.answers).toHaveLength(1);
    expect(selectCurrentAnswer(state)?.isCorrect).toBe(true);
    state = quizReducer(state, { type: "NEXT" });
    state = quizReducer(state, { type: "ANSWER", selectedIndex: 3 });
    state = quizReducer(state, { type: "NEXT" });
    expect(state.phase).toBe("summary");
    expect(state.session).toMatchObject({ correctCount: 1, wrongCount: 1, status: "completed" });
  });

  it("restores an active saved session", () => {
    const saved = { ...quiz, currentSession: { levelId: "one", questions, answers: [], currentIndex: 0, status: "active" } };
    const state = quizReducer(initialQuizState, { type: "LOAD_QUIZ", quiz: saved });
    expect(state.phase).toBe("playing");
    expect(state.selectedLevel.id).toBe("one");
  });
});
