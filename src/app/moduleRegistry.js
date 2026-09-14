import { BrainCircuit } from "lucide-react";

export const modules = Object.freeze([
  Object.freeze({
    id: "quiz",
    name: "AI Quiz",
    description: "Turn any topic into progressive levels and short quizzes that remember your progress.",
    route: "/quiz",
    icon: BrainCircuit,
    status: "Ready",
    theme: "quiz",
    themeRoutes: Object.freeze(["/quiz", "/library"])
  })
]);
