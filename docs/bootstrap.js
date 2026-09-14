const BASE = "/ai-tools/";
const root = document.getElementById("root");
const isChatRoute = () => (location.hash.slice(1).split("?")[0] || "/").startsWith("/smith");
const startedInChat = isChatRoute();

function stylesheet(path) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = BASE + path;
    link.onload = resolve;
    link.onerror = () => reject(new Error("A required style could not be loaded."));
    document.head.append(link);
  });
}

function script(path, module = false) {
  return new Promise((resolve, reject) => {
    const element = document.createElement("script");
    element.src = BASE + path;
    if (module) element.type = "module";
    element.onload = resolve;
    element.onerror = () => reject(new Error("A required application file could not be loaded."));
    document.head.append(element);
  });
}

async function start() {
  if (startedInChat) {
    await stylesheet("smith-app.css");
    await script("smith-app.js", true);
    return;
  }
  await Promise.all([
    stylesheet("assets/index-CmywP56m.css"),
    stylesheet("art-theme.css")
  ]);
  await script("assets/index-D1sKwAOv.js", true);
  await Promise.all([script("art-theme.js"), script("smith-nav.js")]);
}

window.addEventListener("hashchange", () => {
  if (isChatRoute() !== startedInChat) location.reload();
});

start().catch((error) => {
  root.innerHTML = `<section class="boot-error"><h1>AI Tools could not load</h1><p>${error.message || "Check your connection and try again."}</p><button type="button">Try again</button></section>`;
  root.querySelector("button")?.addEventListener("click", () => location.reload());
});
