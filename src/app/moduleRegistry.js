import { Bot, BrainCircuit } from "lucide-react";

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
  }),
  Object.freeze({
    id: "smith",
    name: "Chat",
    description: "Create distinct AI personalities, then talk with them across private saved sessions.",
    route: "/smith",
    icon: Bot,
    status: "Ready",
    theme: "smith",
    themeRoutes: Object.freeze(["/smith"])
  })
]);
