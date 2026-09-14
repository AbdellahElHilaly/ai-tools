import { retryRead, timeoutSignal, withTimeout } from "../../../core/network/asyncPolicy";
import { supabase } from "../../../core/supabase/client";
import { normalizeLanguages } from "../domain/languages";

const AVATAR_BUCKET = "smith-character-avatars";
const READ_TIMEOUT = 12000;
const WRITE_TIMEOUT = 20000;

async function requireUser() {
  const { data, error } = await withTimeout(
    supabase.auth.getSession(),
    8000,
    "Session check took too long."
  );
  if (error || !data.session?.user) {
    const authError = new Error("Sign in first to use Chat.");
    authError.code = "AUTH_REQUIRED";
    throw authError;
  }
  return data.session.user;
}

async function read(buildQuery) {
  return retryRead(async () => {
    const { data, error } = await buildQuery().abortSignal(timeoutSignal(READ_TIMEOUT));
    if (error) throw error;
    return data;
  });
}

async function write(query) {
  const { data, error } = await query.abortSignal(timeoutSignal(WRITE_TIMEOUT));
  if (error) throw error;
  return data;
}

async function removeAvatars(paths) {
  const filtered = paths.filter(Boolean);
  if (!filtered.length) return;
  await withTimeout(supabase.storage.from(AVATAR_BUCKET).remove(filtered), 15000).catch(() => null);
}

async function avatarUrls(rows) {
  const paths = [...new Set(rows.map((row) => row?.avatar_path).filter(Boolean))];
  if (!paths.length) return new Map();
  try {
    const { data, error } = await withTimeout(
      supabase.storage.from(AVATAR_BUCKET).createSignedUrls(paths, 60 * 60),
      12000,
      "Profile images took too long to load."
    );
    if (error) return new Map();
    return new Map((data || []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));
  } catch {
    return new Map();
  }
}

function mapCharacter(row, urls = new Map()) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    brief: row.brief,
    headerPrompt: row.header_prompt,
    avatarPath: row.avatar_path,
    avatarUrl: urls.get(row.avatar_path) || "",
    allowedLanguages: row.allowed_languages || ["en"],
    preferredLanguage: row.preferred_language || "en",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function mapCharacters(rows = []) {
  const urls = await avatarUrls(rows);
  return rows.map((row) => mapCharacter(row, urls));
}

async function mapSessions(rows = []) {
  const characters = rows
    .map((row) => Array.isArray(row.smith_characters) ? row.smith_characters[0] : row.smith_characters)
    .filter(Boolean);
  const urls = await avatarUrls(characters);
  return rows.map((row) => {
    const nested = Array.isArray(row.smith_characters) ? row.smith_characters[0] : row.smith_characters;
    return {
      id: row.id,
      characterId: row.character_id,
      title: row.title,
      language: row.language,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      character: mapCharacter(nested, urls)
    };
  });
}

function extensionFor(file) {
  const fromName = file.name?.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName && fromName.length <= 5) return fromName;
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
}

async function uploadAvatar(userId, characterId, file) {
  if (!file?.type?.startsWith("image/")) throw new Error("Choose a valid image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Profile image must be smaller than 5 MB.");
  const path = `${userId}/${characterId}-${Date.now()}.${extensionFor(file)}`;
  const { error } = await withTimeout(
    supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    }),
    30000,
    "The profile image upload took too long."
  );
  if (error) throw error;
  return path;
}

export const smithRepository = {
  async listCharacters() {
    await requireUser();
    const rows = await read(() => supabase
      .from("smith_characters")
      .select("*")
      .order("updated_at", { ascending: false }));
    return mapCharacters(rows || []);
  },

  async createCharacter(input, avatarFile) {
    const user = await requireUser();
    const id = crypto.randomUUID();
    let avatarPath = null;
    if (avatarFile) avatarPath = await uploadAvatar(user.id, id, avatarFile);
    const languages = normalizeLanguages(input.allowedLanguages);
    const row = {
      id,
      user_id: user.id,
      name: input.name.trim(),
      brief: input.brief.trim(),
      header_prompt: input.headerPrompt.trim(),
      avatar_path: avatarPath,
      allowed_languages: languages,
      preferred_language: languages.includes(input.preferredLanguage) ? input.preferredLanguage : languages[0]
    };
    try {
      const data = await write(supabase.from("smith_characters").insert(row).select("*").single());
      return (await mapCharacters([data]))[0];
    } catch (error) {
      await removeAvatars([avatarPath]);
      throw error;
    }
  },

  async updateCharacter(id, input, { avatarFile, removeAvatar = false } = {}) {
    const user = await requireUser();
    const current = await read(() => supabase
      .from("smith_characters")
      .select("avatar_path")
      .eq("id", id)
      .single());
    let nextAvatarPath = removeAvatar ? null : current.avatar_path;
    if (avatarFile) nextAvatarPath = await uploadAvatar(user.id, id, avatarFile);
    const languages = normalizeLanguages(input.allowedLanguages);
    try {
      const data = await write(supabase.from("smith_characters").update({
        name: input.name.trim(),
        brief: input.brief.trim(),
        header_prompt: input.headerPrompt.trim(),
        avatar_path: nextAvatarPath,
        allowed_languages: languages,
        preferred_language: languages.includes(input.preferredLanguage) ? input.preferredLanguage : languages[0]
      }).eq("id", id).select("*").single());
      if (current.avatar_path !== nextAvatarPath) await removeAvatars([current.avatar_path]);
      return (await mapCharacters([data]))[0];
    } catch (error) {
      if (avatarFile) await removeAvatars([nextAvatarPath]);
      throw error;
    }
  },

  async deleteCharacter(character) {
    await requireUser();
    await write(supabase.from("smith_characters").delete().eq("id", character.id));
    await removeAvatars([character.avatarPath]);
  },

  async listSessions() {
    await requireUser();
    const rows = await read(() => supabase
      .from("smith_sessions")
      .select("*, smith_characters(*)")
      .order("updated_at", { ascending: false }));
    return mapSessions(rows || []);
  },

  async createSession({ characterId, language, title = "New conversation" }) {
    const user = await requireUser();
    const data = await write(supabase.from("smith_sessions").insert({
      user_id: user.id,
      character_id: characterId,
      language,
      title
    }).select("*, smith_characters(*)").single());
    return (await mapSessions([data]))[0];
  },

  async getSession(id) {
    await requireUser();
    const data = await read(() => supabase
      .from("smith_sessions")
      .select("*, smith_characters(*)")
      .eq("id", id)
      .maybeSingle());
    return data ? (await mapSessions([data]))[0] : null;
  },

  async renameSession(id, title) {
    await requireUser();
    await write(supabase.from("smith_sessions").update({ title: title.trim() }).eq("id", id));
  },

  async deleteSession(id) {
    await requireUser();
    await write(supabase.from("smith_sessions").delete().eq("id", id));
  },

  async listMessages(sessionId) {
    await requireUser();
    return read(() => supabase
      .from("smith_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true }));
  },

  async addUserMessage(sessionId, content) {
    const user = await requireUser();
    return write(supabase.from("smith_messages").insert({
      user_id: user.id,
      session_id: sessionId,
      role: "user",
      content: content.trim()
    }).select("*").single());
  },

  async editMessage(id, content) {
    await requireUser();
    await write(supabase.from("smith_messages").update({
      content: content.trim(),
      edited_at: new Date().toISOString()
    }).eq("id", id));
  },

  async deleteMessage(id) {
    await requireUser();
    await write(supabase.from("smith_messages").delete().eq("id", id));
  }
};
