export const initialQuizState = {
  phase: "create",
  quiz: null,
  selectedLevel: null,
  session: null
};

export function quizReducer(state, action) {
  switch (action.type) {
    case "PLAN_READY":
      return { ...state, phase: "levels", quiz: action.quiz, selectedLevel: null, session: null };
    case "LOAD_QUIZ": {
      const session = action.quiz.currentSession;
      return {
        phase: session?.questions?.length ? (session.status === "completed" ? "summary" : "playing") : "levels",
        quiz: action.quiz,
        selectedLevel: action.quiz.plan.levels.find((level) => level.id === session?.levelId) ?? null,
        session: session?.questions?.length ? session : null
      };
    }
    case "SELECT_LEVEL":
      return { ...state, selectedLevel: action.level };
    case "QUESTIONS_READY":
      return {
        ...state,
        phase: "playing",
        session: {
          levelId: state.selectedLevel.id,
          levelTitle: state.selectedLevel.title,
          questions: action.questions,
          answers: [],
          currentIndex: 0,
          correctCount: 0,
          wrongCount: 0,
          status: "active"
        }
      };
    case "ANSWER": {
      const question = state.session.questions[state.session.currentIndex];
      if (state.session.answers.some((answer) => answer.questionId === question.id)) return state;
      const isCorrect = action.selectedIndex === question.correctIndex;
      return {
        ...state,
        session: {
          ...state.session,
          answers: [...state.session.answers, { questionId: question.id, selectedIndex: action.selectedIndex, isCorrect }],
          correctCount: state.session.correctCount + Number(isCorrect),
          wrongCount: state.session.wrongCount + Number(!isCorrect)
        }
      };
    }
    case "NEXT": {
      const atEnd = state.session.currentIndex >= state.session.questions.length - 1;
      return {
        ...state,
        phase: atEnd ? "summary" : "playing",
        session: {
          ...state.session,
          currentIndex: atEnd ? state.session.currentIndex : state.session.currentIndex + 1,
          status: atEnd ? "completed" : "active"
        }
      };
    }
    case "BACK_TO_LEVELS":
      return { ...state, phase: "levels", selectedLevel: null, session: null };
    case "RESET":
      return initialQuizState;
    default:
      return state;
  }
}

export function selectCurrentQuestion(state) {
  return state.session?.questions[state.session.currentIndex] ?? null;
}

export function selectCurrentAnswer(state) {
  const question = selectCurrentQuestion(state);
  return question ? state.session.answers.find((answer) => answer.questionId === question.id) ?? null : null;
}
