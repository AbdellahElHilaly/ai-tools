export const initialQuizState = {
  phase: "create",
  quiz: null,
  selectedLevel: null,
  session: null
};

function normalizeProgress(quiz) {
  if (quiz.progressByLevel && typeof quiz.progressByLevel === "object") return quiz.progressByLevel;
  const legacySession = quiz.currentSession;
  return legacySession?.levelId ? { [legacySession.levelId]: legacySession } : {};
}

function syncSession(state, session, phase = state.phase) {
  const progressByLevel = {
    ...state.quiz.progressByLevel,
    [session.levelId]: session
  };

  return {
    ...state,
    phase,
    session,
    quiz: {
      ...state.quiz,
      progressByLevel,
      currentSession: session,
      activeLevelIndex: Math.max(
        0,
        state.quiz.plan.levels.findIndex((level) => level.id === session.levelId)
      )
    }
  };
}

export function quizReducer(state, action) {
  switch (action.type) {
    case "PLAN_READY":
      return {
        ...state,
        phase: "levels",
        quiz: { ...action.quiz, progressByLevel: normalizeProgress(action.quiz) },
        selectedLevel: null,
        session: null
      };
    case "LOAD_QUIZ": {
      const progressByLevel = normalizeProgress(action.quiz);
      const activeLevel = action.quiz.plan.levels[action.quiz.activeLevelIndex ?? 0] ?? null;
      return {
        phase: "levels",
        quiz: { ...action.quiz, progressByLevel },
        selectedLevel: activeLevel,
        session: null
      };
    }
    case "SELECT_LEVEL":
      return { ...state, phase: "levels", selectedLevel: action.level, session: null };
    case "OPEN_LEVEL": {
      const savedSession = state.quiz.progressByLevel[action.level.id];
      if (!savedSession?.questions?.length) return { ...state, selectedLevel: action.level };
      return {
        ...state,
        phase: savedSession.status === "completed" ? "summary" : "playing",
        selectedLevel: action.level,
        session: savedSession
      };
    }
    case "QUESTIONS_READY": {
      const session = {
          levelId: state.selectedLevel.id,
          levelTitle: state.selectedLevel.title,
          questions: action.questions,
          answers: [],
          currentIndex: 0,
          correctCount: 0,
          wrongCount: 0,
          status: "active"
      };
      return syncSession(state, session, "playing");
    }
    case "ANSWER": {
      const question = state.session.questions[state.session.currentIndex];
      if (state.session.answers.some((answer) => answer.questionId === question.id)) return state;
      const isCorrect = action.selectedIndex === question.correctIndex;
      const session = {
        ...state.session,
        answers: [...state.session.answers, { questionId: question.id, selectedIndex: action.selectedIndex, isCorrect }],
        correctCount: state.session.correctCount + Number(isCorrect),
        wrongCount: state.session.wrongCount + Number(!isCorrect)
      };
      return syncSession(state, session);
    }
    case "NEXT": {
      const atEnd = state.session.currentIndex >= state.session.questions.length - 1;
      const session = {
        ...state.session,
        currentIndex: atEnd ? state.session.currentIndex : state.session.currentIndex + 1,
        status: atEnd ? "completed" : "active"
      };
      return syncSession(state, session, atEnd ? "summary" : "playing");
    }
    case "BACK_TO_LEVELS":
      return { ...state, phase: "levels", selectedLevel: null, session: null };
    case "SAVE_TO_LIBRARY":
      return { ...state, quiz: { ...state.quiz, isSaved: true } };
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
