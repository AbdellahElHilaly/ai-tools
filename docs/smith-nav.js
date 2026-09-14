(() => {
  const root = document.getElementById("root");

  function botIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
  }

  function addSidebarLink() {
    const nav = root?.querySelector('aside nav[aria-label="Primary navigation"]');
    if (!nav || nav.querySelector("[data-smith-nav]")) return;
    const link = document.createElement("a");
    link.href = "#/smith";
    link.dataset.smithNav = "true";
    link.className = "group flex min-h-11 items-center gap-3 border-l-2 px-4 text-sm font-semibold transition-colors border-transparent text-muted hover:text-ink";
    link.innerHTML = botIcon() + "<span>Smith</span>";
    const settings = [...nav.querySelectorAll("a")].find((item) => item.textContent.trim() === "Settings");
    nav.insertBefore(link, settings || null);
  }

  function addHomeCard() {
    const currentPath = (location.hash.slice(1).split("?")[0] || "/").replace(/\/$/, "") || "/";
    if (currentPath !== "/") return;
    const grid = root?.querySelector("#tools > div");
    if (!grid || grid.querySelector("[data-smith-launch]")) return;
    const link = document.createElement("a");
    link.href = "#/smith";
    link.dataset.smithLaunch = "true";
    link.className = "smith-launch-card";
    link.innerHTML = '<span class="smith-launch-icon">✦</span><span><strong>Smith Chat</strong><small>Create AI personalities and private saved conversations.</small></span><b>→</b>';
    grid.append(link);
  }

  function sync() {
    addSidebarLink();
    addHomeCard();
  }

  window.addEventListener("hashchange", () => setTimeout(sync, 0));
  if (root) new MutationObserver(sync).observe(root, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sync, { once: true });
  else sync();
})();
