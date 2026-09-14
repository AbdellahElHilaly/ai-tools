import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabase = createClient(
  "https://lnvvtndwkyclayehyjfb.supabase.co",
  "sb_publishable_ZDsw4K4lHDzWuYo7Y2XkNA_EcSI6zc4",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
const bucket = "smith-character-avatars";
const languages = [
  ["en", "English"], ["ar", "Arabic"], ["fr", "French"], ["es", "Spanish"],
  ["de", "German"], ["it", "Italian"], ["pt", "Portuguese"]
];
const languageName = (code) => languages.find(([value]) => value === code)?.[1] || code;
const app = document.createElement("div");
app.id = "smith-standalone";
app.hidden = true;
document.body.append(app);

let user = null;
let characters = [];
let sessions = [];
let activeSession = null;
let busy = false;

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
function attr(value = "") { return esc(value); }
function path() { return (location.hash.slice(1).split("?")[0] || "/").replace(/\/$/, "") || "/"; }
function avatarUrl(value) {
  return value?._avatar_url || "";
}
async function signAvatar(value) {
  if (!value?.avatar_path) return { ...value, _avatar_url: "" };
  const { data, error } = await withTimeout(
    supabase.storage.from(bucket).createSignedUrl(value.avatar_path, 60 * 60),
    10000,
    "Profile image took too long to load."
  );
  return { ...value, _avatar_url: error ? "" : data.signedUrl };
}
function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
function avatar(character, size = "") {
  const url = avatarUrl(character);
  return url
    ? `<img class="ss-avatar ${size}" src="${attr(url)}" alt="">`
    : `<span class="ss-avatar ss-avatar-fallback ${size}">${esc(initials(character?.name) || "AI")}</span>`;
}
function errorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}
function withTimeout(task, timeout = 15000, message = "The request took too long. Check your connection and try again.") {
  let timeoutId;
  const guard = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeout);
  });
  return Promise.race([Promise.resolve(task), guard]).finally(() => clearTimeout(timeoutId));
}
function getSessionId() {
  const match = path().match(/^\/smith\/chat\/([0-9a-f-]+)$/i);
  return match?.[1] || "";
}
function shell(content, active = "characters") {
  app.classList.remove("sidebar-open");
  app.innerHTML = `
    <div class="ss-shell">
      <header class="ss-topbar">
        <strong>Chat</strong>
        <button class="ss-nav-toggle" type="button" data-action="toggle-sidebar" aria-label="Open sidebar" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </header>
      <aside class="ss-rail">
        <a href="#/" class="ss-brand"><span>✦</span> AI Tools</a>
        <nav>
          <a href="#/smith" class="${active === "characters" ? "active" : ""}">Characters</a>
          <a href="#/smith/chats" class="${active === "chats" ? "active" : ""}">Chats</a>
        </nav>
      </aside>
      <button class="ss-rail-scrim" type="button" data-action="toggle-sidebar" aria-label="Close sidebar"></button>
      <main class="ss-main">${content}</main>
      <nav class="ss-tabs">
        <a href="#/smith" class="${active === "characters" ? "active" : ""}"><span>♙</span>Characters</a>
        <a href="#/smith/chats" class="${active === "chats" ? "active" : ""}"><span>◌</span>Chats</a>
      </nav>
    </div>`;
}
function authRequired() {
  shell(`<section class="ss-empty"><span class="ss-spark">✦</span><h1>Sign in to use Chat</h1><p>Your characters and conversations stay private to your account.</p><a class="ss-primary" href="#/config?section=account">Open account settings</a></section>`);
}

async function ensureUser() {
  const { data, error } = await withTimeout(
    supabase.auth.getSession(),
    10000,
    "Session check took too long. Check your connection and try again."
  );
  if (error) throw error;
  user = data.session?.user || null;
  return user;
}
async function loadCharacters() {
  const { data, error } = await withTimeout(
    supabase.from("smith_characters").select("*").order("updated_at", { ascending: false })
  );
  if (error) throw error;
  characters = await Promise.all((data || []).map(signAvatar));
}
async function loadSessions() {
  const { data, error } = await withTimeout(
    supabase.from("smith_sessions").select("*, smith_characters(*)").order("updated_at", { ascending: false })
  );
  if (error) throw error;
  sessions = data || [];
  await Promise.all(sessions.map(async (session) => {
    const nested = Array.isArray(session.smith_characters) ? session.smith_characters[0] : session.smith_characters;
    if (!nested) return;
    const signed = await signAvatar(nested);
    session.smith_characters = Array.isArray(session.smith_characters) ? [signed] : signed;
  }));
}
function setBusy(value) {
  busy = value;
  app.querySelectorAll("button").forEach((button) => { button.disabled = value; });
}

async function renderCharacters() {
  busy = false;
  if (!user && !(await ensureUser())) return authRequired();
  shell(`
    <section class="ss-page">
      <header class="ss-page-head">
        <div><small>CHAT</small><h1>Your characters</h1><p>Create personalities with their own voice, image, and languages.</p></div>
        <button class="ss-primary" data-action="new-character">＋ New character</button>
      </header>
      <div class="ss-status">Loading characters…</div>
      <div class="ss-character-grid"></div>
    </section>`);
  try {
    await loadCharacters();
    const status = app.querySelector(".ss-status");
    const grid = app.querySelector(".ss-character-grid");
    status.remove();
    if (!characters.length) {
      grid.innerHTML = `<section class="ss-empty"><span class="ss-spark">✦</span><h2>Shape your first personality</h2><p>Give it a precise identity and decide how it should speak.</p><button class="ss-primary" data-action="new-character">＋ Create character</button></section>`;
      return;
    }
    grid.innerHTML = characters.map((character) => `
      <article class="ss-character-card">
        <div class="ss-card-top">
          ${avatar(character, "large")}
          <div class="ss-actions">
            <button data-action="edit-character" data-id="${character.id}" aria-label="Edit">Edit</button>
            <button class="danger" data-action="delete-character" data-id="${character.id}" aria-label="Delete">Delete</button>
          </div>
        </div>
        <div><h2>${esc(character.name)}</h2><p>${esc(character.brief || "No description yet.")}</p></div>
        <div class="ss-language-row">${(character.allowed_languages || ["en"]).map((code) => `<span>${esc(languageName(code))}</span>`).join("")}</div>
        <button class="ss-chat-button" data-action="start-chat" data-id="${character.id}">◌ Start chat</button>
      </article>`).join("");
  } catch (error) {
    const status = app.querySelector(".ss-status");
    if (status) {
      status.className = "ss-error";
      status.textContent = errorMessage(error);
    }
  }
}

function characterForm(character = null) {
  const selected = character?.allowed_languages || ["en"];
  const languageButtons = languages.map(([code, label]) => `
    <label class="ss-language-check">
      <input type="checkbox" name="languages" value="${code}" ${selected.includes(code) ? "checked" : ""}>
      <span>${label}</span>
    </label>`).join("");
  const preferred = character?.preferred_language || selected[0] || "en";
  app.insertAdjacentHTML("beforeend", `
    <div class="ss-modal">
      <form class="ss-character-form" data-id="${character?.id || ""}">
        <header><div><small>${character ? "EDIT CHARACTER" : "NEW CHARACTER"}</small><h2>${esc(character?.name || "Create a personality")}</h2></div><button type="button" data-action="close-modal" aria-label="Close">×</button></header>
        <div class="ss-avatar-edit">${avatar(character || { name: "AI" }, "large")}<label class="ss-file">Choose image<input type="file" name="avatar" accept="image/png,image/jpeg,image/webp,image/gif"></label>${character?.avatar_path ? '<label class="ss-remove"><input type="checkbox" name="removeAvatar"> Remove current image</label>' : ""}</div>
        <label class="ss-field"><span>Name</span><input name="name" maxlength="80" required value="${attr(character?.name || "")}" placeholder="e.g. Calm mentor"></label>
        <label class="ss-field"><span>Brief description</span><textarea name="brief" maxlength="500" rows="2" placeholder="A short description for the character card.">${esc(character?.brief || "")}</textarea></label>
        <label class="ss-field"><span>Character instructions</span><textarea name="headerPrompt" minlength="10" maxlength="8000" rows="6" required placeholder="Personality, tone, expertise, boundaries, and how to answer.">${esc(character?.header_prompt || "")}</textarea></label>
        <fieldset class="ss-field"><legend>Conversation languages</legend><div class="ss-language-grid">${languageButtons}</div></fieldset>
        <label class="ss-field"><span>Default language</span><select name="preferredLanguage">${selected.map((code) => `<option value="${code}" ${code === preferred ? "selected" : ""}>${esc(languageName(code))}</option>`).join("")}</select></label>
        <footer><button type="button" data-action="close-modal">Cancel</button><button class="ss-primary" type="submit">${character ? "Save changes" : "Create character"}</button></footer>
      </form>
    </div>`);
}
async function uploadAvatar(characterId, file) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) throw new Error("Choose a valid image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Profile image must be smaller than 5 MB.");
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const storagePath = `${user.id}/${characterId}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(storagePath, file, { contentType: file.type, cacheControl: "3600" });
  if (error) throw error;
  return storagePath;
}
async function saveCharacter(form) {
  const formData = new FormData(form);
  const allowed = formData.getAll("languages");
  if (!allowed.length) throw new Error("Choose at least one conversation language.");
  const id = form.dataset.id || crypto.randomUUID();
  const current = characters.find((item) => item.id === id);
  const file = formData.get("avatar");
  let nextPath = formData.get("removeAvatar") ? null : current?.avatar_path || null;
  const uploaded = file?.size ? await uploadAvatar(id, file) : null;
  if (uploaded) nextPath = uploaded;
  const preferred = allowed.includes(formData.get("preferredLanguage")) ? formData.get("preferredLanguage") : allowed[0];
  const values = {
    user_id: user.id,
    name: String(formData.get("name")).trim(),
    brief: String(formData.get("brief")).trim(),
    header_prompt: String(formData.get("headerPrompt")).trim(),
    avatar_path: nextPath,
    allowed_languages: allowed,
    preferred_language: preferred
  };
  const query = current
    ? supabase.from("smith_characters").update(values).eq("id", id)
    : supabase.from("smith_characters").insert({ id, ...values });
  const { error } = await query;
  if (error) {
    if (uploaded) await supabase.storage.from(bucket).remove([uploaded]);
    throw error;
  }
  if (current?.avatar_path && current.avatar_path !== nextPath) await supabase.storage.from(bucket).remove([current.avatar_path]);
  app.querySelector(".ss-modal")?.remove();
  await renderCharacters();
}
function sessionDialog(character) {
  const options = (character.allowed_languages || ["en"]).map((code) => `<option value="${code}" ${code === character.preferred_language ? "selected" : ""}>${esc(languageName(code))}</option>`).join("");
  app.insertAdjacentHTML("beforeend", `
    <div class="ss-modal">
      <form class="ss-session-form" data-id="${character.id}">
        <header>${avatar(character)}<div><small>NEW SESSION</small><h2>${esc(character.name)}</h2></div><button type="button" data-action="close-modal">×</button></header>
        <label class="ss-field"><span>Conversation language</span><select name="language">${options}</select></label>
        <footer><button type="button" data-action="close-modal">Cancel</button><button class="ss-primary" type="submit">Start chat</button></footer>
      </form>
    </div>`);
}
async function createSession(characterId, language) {
  const { data, error } = await supabase.from("smith_sessions").insert({
    user_id: user.id, character_id: characterId, language, title: "New conversation"
  }).select("id").single();
  if (error) throw error;
  location.hash = `#/smith/chat/${data.id}`;
}

async function renderSessions() {
  busy = false;
  if (!user && !(await ensureUser())) return authRequired();
  shell(`
    <section class="ss-page">
      <header class="ss-page-head"><div><small>CHAT</small><h1>Chat history</h1><p>Continue or manage your saved conversations.</p></div><a class="ss-primary" href="#/smith">＋ New session</a></header>
      <div class="ss-status">Loading chats…</div><div class="ss-session-list"></div>
    </section>`, "chats");
  try {
    await loadSessions();
    app.querySelector(".ss-status").remove();
    const list = app.querySelector(".ss-session-list");
    if (!sessions.length) {
      list.innerHTML = `<section class="ss-empty"><span class="ss-spark">◌</span><h2>No conversations yet</h2><p>Choose a character to start talking.</p><a class="ss-primary" href="#/smith">Choose character</a></section>`;
      return;
    }
    list.innerHTML = sessions.map((session) => {
      const character = Array.isArray(session.smith_characters) ? session.smith_characters[0] : session.smith_characters;
      return `<article class="ss-session-card">
        <a href="#/smith/chat/${session.id}">${avatar(character)}<span><strong>${esc(session.title)}</strong><small>${esc(character?.name)} · ${esc(languageName(session.language))}</small></span></a>
        <div class="ss-actions"><button data-action="rename-session" data-id="${session.id}">Rename</button><button class="danger" data-action="delete-session" data-id="${session.id}">Delete</button></div>
      </article>`;
    }).join("");
  } catch (error) {
    const status = app.querySelector(".ss-status");
    if (status) {
      status.className = "ss-error";
      status.textContent = errorMessage(error);
    }
  }
}

async function renderChat() {
  busy = false;
  if (!user && !(await ensureUser())) return authRequired();
  const id = getSessionId();
  shell('<section class="ss-status ss-chat-loading">Loading conversation…</section>', "chats");
  const { data: session, error } = await withTimeout(
    supabase.from("smith_sessions").select("*, smith_characters(*)").eq("id", id).maybeSingle()
  );
  if (error || !session) {
    app.querySelector(".ss-main").innerHTML = `<section class="ss-empty"><h1>Conversation not found</h1><a class="ss-primary" href="#/smith/chats">Back to chats</a></section>`;
    return;
  }
  const rawCharacter = Array.isArray(session.smith_characters) ? session.smith_characters[0] : session.smith_characters;
  const character = await signAvatar(rawCharacter);
  session.smith_characters = Array.isArray(session.smith_characters) ? [character] : character;
  activeSession = session;
  app.querySelector(".ss-main").innerHTML = `
    <section class="ss-chat">
      <header class="ss-chat-head"><a href="#/smith/chats" aria-label="Back">←</a>${avatar(character)}<div><strong>${esc(character.name)}</strong><small>${esc(languageName(session.language))}</small></div></header>
      <div class="ss-messages"><div class="ss-status">Loading messages…</div></div>
      <form class="ss-composer"><textarea name="message" rows="1" maxlength="20000" placeholder="Message ${attr(character.name)}" aria-label="Message"></textarea><button type="submit" aria-label="Send">➤</button></form>
    </section>`;
  await refreshMessages();
}
async function refreshMessages() {
  const list = app.querySelector(".ss-messages");
  if (!list || !activeSession) return;
  const { data, error } = await withTimeout(
    supabase.from("smith_messages").select("*").eq("session_id", activeSession.id).order("created_at", { ascending: true })
  );
  if (error) {
    list.innerHTML = `<p class="ss-error">${esc(errorMessage(error))}</p>`;
    return;
  }
  const character = Array.isArray(activeSession.smith_characters) ? activeSession.smith_characters[0] : activeSession.smith_characters;
  if (!data.length) {
    list.innerHTML = `<div class="ss-welcome">${avatar(character, "large")}<h1>Talk with ${esc(character.name)}</h1><p>${esc(character.brief || "Start whenever you are ready.")}</p></div>`;
    return;
  }
  list.innerHTML = data.map((message) => `
    <article class="ss-message ${message.role}">
      <div>${esc(message.content)}</div>
      <footer><small>${message.edited_at ? "edited" : ""}</small><span><button data-action="edit-message" data-id="${message.id}">Edit</button><button data-action="delete-message" data-id="${message.id}">Delete</button></span></footer>
    </article>`).join("") + (busy ? '<div class="ss-typing"><i></i><i></i><i></i></div>' : "");
  list.scrollTop = list.scrollHeight;
}
async function sendMessage(form) {
  const textarea = form.elements.message;
  const content = textarea.value.trim();
  if (!content || busy) return;
  busy = true;
  textarea.value = "";
  const { error } = await supabase.from("smith_messages").insert({
    user_id: user.id, session_id: activeSession.id, role: "user", content
  });
  if (error) { busy = false; throw error; }
  await refreshMessages();
  const result = await supabase.functions.invoke("smith-chat", { body: { sessionId: activeSession.id } });
  busy = false;
  if (result.error) {
    let message = result.error.message;
    try { message = (await result.error.context.clone().json())?.error?.message || message; } catch { /* keep fallback */ }
    await refreshMessages();
    app.querySelector(".ss-messages")?.insertAdjacentHTML("beforeend", `<p class="ss-error">${esc(message)}</p>`);
    return;
  }
  await refreshMessages();
}

async function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target || busy) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (action === "toggle-sidebar") {
    const open = app.classList.toggle("sidebar-open");
    app.querySelector(".ss-nav-toggle")?.setAttribute("aria-expanded", String(open));
    return;
  }
  if (action === "retry-route") {
    await route();
    return;
  }
  try {
    if (action === "new-character") characterForm();
    if (action === "close-modal") target.closest(".ss-modal")?.remove();
    if (action === "edit-character") characterForm(characters.find((item) => item.id === id));
    if (action === "start-chat") sessionDialog(characters.find((item) => item.id === id));
    if (action === "delete-character" && confirm("Delete this character and all its chats?")) {
      setBusy(true);
      const character = characters.find((item) => item.id === id);
      const { error } = await supabase.from("smith_characters").delete().eq("id", id);
      if (error) throw error;
      if (character?.avatar_path) await supabase.storage.from(bucket).remove([character.avatar_path]);
      await renderCharacters();
    }
    if (action === "rename-session") {
      const session = sessions.find((item) => item.id === id);
      const title = prompt("Rename conversation", session?.title || "")?.trim();
      if (title) {
        const { error } = await supabase.from("smith_sessions").update({ title }).eq("id", id);
        if (error) throw error;
        await renderSessions();
      }
    }
    if (action === "delete-session" && confirm("Delete this conversation?")) {
      const { error } = await supabase.from("smith_sessions").delete().eq("id", id);
      if (error) throw error;
      await renderSessions();
    }
    if (action === "edit-message") {
      const current = app.querySelector(`[data-id="${CSS.escape(id)}"]`)?.closest(".ss-message")?.querySelector(":scope > div")?.textContent || "";
      const content = prompt("Edit message", current)?.trim();
      if (content) {
        const { error } = await supabase.from("smith_messages").update({ content, edited_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        await refreshMessages();
      }
    }
    if (action === "delete-message" && confirm("Delete this message?")) {
      const { error } = await supabase.from("smith_messages").delete().eq("id", id);
      if (error) throw error;
      await refreshMessages();
    }
  } catch (error) {
    setBusy(false);
    alert(errorMessage(error));
  }
}
async function handleSubmit(event) {
  if (event.target.matches(".ss-character-form")) {
    event.preventDefault();
    setBusy(true);
    try { await saveCharacter(event.target); } catch (error) { alert(errorMessage(error)); setBusy(false); }
  }
  if (event.target.matches(".ss-session-form")) {
    event.preventDefault();
    setBusy(true);
    try { await createSession(event.target.dataset.id, new FormData(event.target).get("language")); } catch (error) { alert(errorMessage(error)); setBusy(false); }
  }
  if (event.target.matches(".ss-composer")) {
    event.preventDefault();
    try { await sendMessage(event.target); } catch (error) { busy = false; alert(errorMessage(error)); await refreshMessages(); }
  }
}
function syncPreferredLanguages(event) {
  if (!event.target.matches('input[name="languages"]')) return;
  const form = event.target.form;
  const selected = [...form.querySelectorAll('input[name="languages"]:checked')].map((input) => input.value);
  const select = form.elements.preferredLanguage;
  const current = select.value;
  select.innerHTML = selected.map((code) => `<option value="${code}">${esc(languageName(code))}</option>`).join("");
  if (selected.includes(current)) select.value = current;
}

function injectHomeCard() {
  if (path() !== "/") return;
  const grid = document.querySelector("#tools > div");
  if (!grid || grid.querySelector("[data-smith-launch]")) return;
  const link = document.createElement("a");
  link.href = "#/smith";
  link.dataset.smithLaunch = "true";
  link.className = "smith-launch-card";
  link.innerHTML = '<span class="smith-launch-icon">✦</span><span><strong>Chat</strong><small>Create AI personalities and private saved conversations.</small></span><b>→</b>';
  grid.append(link);
}
async function route() {
  const smithOpen = path().startsWith("/smith");
  app.hidden = !smithOpen;
  document.body.classList.toggle("smith-standalone-open", smithOpen);
  if (!smithOpen) {
    activeSession = null;
    setTimeout(injectHomeCard, 80);
    return;
  }
  try {
    if (path() === "/smith") await renderCharacters();
    else if (path() === "/smith/chats") await renderSessions();
    else if (getSessionId()) await renderChat();
    else location.hash = "#/smith";
  } catch (error) {
    const active = path().includes("/chat") ? "chats" : "characters";
    shell(`<section class="ss-empty"><span class="ss-spark">!</span><h1>Chat could not load</h1><p>${esc(errorMessage(error))}</p><button class="ss-primary" data-action="retry-route">Try again</button></section>`, active);
  }
}

app.addEventListener("click", handleClick);
app.addEventListener("submit", handleSubmit);
app.addEventListener("change", syncPreferredLanguages);
window.addEventListener("hashchange", route);
new MutationObserver(injectHomeCard).observe(document.getElementById("root"), { childList: true, subtree: true });
supabase.auth.onAuthStateChange((_event, session) => {
  user = session?.user || null;
  if (path().startsWith("/smith")) setTimeout(() => route(), 0);
});
try {
  await ensureUser();
} catch {
  user = null;
}
await route();
