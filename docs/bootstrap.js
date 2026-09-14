const BASE = "/ai-tools/";
const isChatRoute = () => (location.hash.slice(1).split("?")[0] || "/").startsWith("/smith");
const startedInChat = isChatRoute();
const BOOT_TIMEOUT = 20000;

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

function timeout(task) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("The application files took too long to arrive.")), BOOT_TIMEOUT);
  });
  return Promise.race([task, deadline]).finally(() => clearTimeout(timer));
}

function start() {
  if (startedInChat) {
    return script("smith-app.js", true);
  }
  return Promise.all([
    script("assets/index-D1sKwAOv.js", true),
    script("art-theme.js"),
    script("smith-nav.js")
  ]);
}

window.addEventListener("hashchange", () => {
  if (isChatRoute() !== startedInChat) location.reload();
});

timeout(start()).catch((error) => {
  const notice = document.getElementById("boot-error");
  if (!notice) return;
  notice.hidden = false;
  notice.className = "boot-error";
  notice.innerHTML = `${error.message || "A file could not be loaded."}<button type="button">Try again</button>`;
  notice.querySelector("button")?.addEventListener("click", () => location.reload());
});
