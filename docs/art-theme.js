(() => {
  const themes = {
    home: { color: "#3a86ff" },
    quiz: { color: "#6746e8" },
    smith: { color: "#159a9a" },
    settings: { color: "#2878ed" }
  };

  function resolveTheme() {
    const path = (window.location.hash.slice(1).split("?")[0] || "/").replace(/\/$/, "") || "/";
    if (path === "/quiz" || path === "/library") return "quiz";
    if (path.startsWith("/smith")) return "smith";
    if (path === "/config") return "settings";
    return "home";
  }

  function applyTheme() {
    const theme = resolveTheme();
    document.body.dataset.moduleTheme = theme;
    document.documentElement.dataset.moduleTheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themes[theme].color);
  }

  window.addEventListener("hashchange", applyTheme);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyTheme, { once: true });
  else applyTheme();
})();
