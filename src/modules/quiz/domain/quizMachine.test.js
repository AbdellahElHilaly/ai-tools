import { describe, expect, it } from "vitest";
import { initialQuizState, quizReducer, selectCurrentAnswer } from "./quizMachine";

const quiz = {
  plan: { levels: [{ id: "one", title: "الأول", summary: "", topics: ["A", "B"] }] },
  progressByLevel: {}
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

  it("loads a saved quiz at the level picker and resumes on demand", () => {
    const session = { levelId: "one", questions, answers: [], currentIndex: 0, status: "active" };
    const saved = { ...quiz, progressByLevel: { one: session }, activeLevelIndex: 0 };
    let state = quizReducer(initialQuizState, { type: "LOAD_QUIZ", quiz: saved });
    expect(state.phase).toBe("levels");
    expect(state.selectedLevel.id).toBe("one");
    state = quizReducer(state, { type: "OPEN_LEVEL", level: quiz.plan.levels[0] });
    expect(state.phase).toBe("playing");
    expect(state.session).toEqual(session);
  });

  it("keeps progress for each level when another level starts", () => {
    const second = { id: "two", title: "الثاني", summary: "", topics: ["C", "D"] };
    const multiLevelQuiz = { ...quiz, plan: { levels: [...quiz.plan.levels, second] } };
    let state = quizReducer(initialQuizState, { type: "PLAN_READY", quiz: multiLevelQuiz });
    state = quizReducer(state, { type: "SELECT_LEVEL", level: multiLevelQuiz.plan.levels[0] });
    state = quizReducer(state, { type: "QUESTIONS_READY", questions });
    state = quizReducer(state, { type: "ANSWER", selectedIndex: 1 });
    state = quizReducer(state, { type: "BACK_TO_LEVELS" });
    state = quizReducer(state, { type: "SELECT_LEVEL", level: second });
    state = quizReducer(state, { type: "QUESTIONS_READY", questions: [{ ...questions[0], id: "q3" }] });

    expect(state.quiz.progressByLevel.one.answers).toHaveLength(1);
    expect(state.quiz.progressByLevel.two.questions[0].id).toBe("q3");
  });
});
