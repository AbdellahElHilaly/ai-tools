import {
  BookMarked,
  BrainCircuit,
  House,
  KeyRound,
  Settings2,
  Sparkles,
  UserRound
} from "lucide-react";

export const primaryNavigation = Object.freeze([
  { to: "/", label: "Home", icon: House, isActive: (path) => path === "/" },
  { to: "/quiz", label: "Quiz", icon: BrainCircuit, isActive: (path) => path === "/quiz" || path === "/library" },
  { to: "/config", label: "Settings", icon: Settings2, isActive: (path) => path === "/config" }
]);

export const contextualNavigation = Object.freeze({
  home: [
    { to: "/", label: "Overview", icon: House, exact: true },
    { to: "/?section=tools", label: "Tools", icon: Sparkles, search: "section=tools" }
  ],
  quiz: [
    { to: "/quiz", label: "New quiz", icon: BrainCircuit, exact: true },
    { to: "/library", label: "My quizzes", icon: BookMarked, pathname: "/library" }
  ],
  settings: [
    { to: "/config?section=account", label: "Account", icon: UserRound, search: "section=account" },
    { to: "/config?section=keys", label: "API keys", icon: KeyRound, search: "section=keys" }
  ]
});

export function resolveNavigationSection(pathname) {
  if (pathname === "/config") return "settings";
  if (pathname === "/quiz" || pathname === "/library") return "quiz";
  return "home";
}

export function isContextItemActive(item, location) {
  if (item.search === "section=account" && location.pathname === "/config" && !location.search.includes("section=")) {
    return true;
  }
  if (item.pathname) return location.pathname === item.pathname;
  if (item.search) return location.search.includes(item.search);
  return Boolean(item.exact && location.pathname === item.to && !location.search);
}
