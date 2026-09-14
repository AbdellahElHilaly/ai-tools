import { modules } from "./moduleRegistry";

export const themes = Object.freeze({
  home: Object.freeze({ id: "home", className: "theme-home", chromeColor: "#3a86ff" }),
  quiz: Object.freeze({ id: "quiz", className: "theme-quiz", chromeColor: "#7657ff" }),
  smith: Object.freeze({ id: "smith", className: "theme-smith", chromeColor: "#18a6a6" }),
  settings: Object.freeze({ id: "settings", className: "theme-settings", chromeColor: "#3a86ff" })
});

export function resolveModuleTheme(pathname) {
  if (pathname === "/config") return themes.settings;
  const module = modules.find((item) => item.themeRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)));
  return module ? themes[module.theme] : themes.home;
}
