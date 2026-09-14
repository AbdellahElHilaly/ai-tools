import { supabase } from "../../../core/supabase/client";
import { normalizeLanguages } from "../domain/languages";

const AVATAR_BUCKET = "smith-character-avatars";

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const authError = new Error("Sign in first to use Chat.");
    authError.code = "AUTH_REQUIRED";
    throw authError;
  }
  return data.user;
}

async function avatarUrl(path) {
  if (!path) return "";
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 60 * 60);
  return error ? "" : data.signedUrl;
}

async function mapCharacter(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    brief: row.brief,
    headerPrompt: row.header_prompt,
    avatarPath: row.avatar_path,
    avatarUrl: await avatarUrl(row.avatar_path),
    allowedLanguages: row.allowed_languages || ["en"],
    preferredLanguage: row.preferred_language || "en",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function mapSession(row) {
  if (!row) return null;
  const nested = Array.isArray(row.smith_characters) ? row.smith_characters[0] : row.smith_characters;
  return {
    id: row.id,
    characterId: row.character_id,
    title: row.title,
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    character: await mapCharacter(nested)
  };
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
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });
  if (error) throw error;
  return path;
}

export const smithRepository = {
  async listCharacters() {
    await requireUser();
    const { data, error } = await supabase.from("smith_characters").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return Promise.all(data.map(mapCharacter));
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
    const { data, error } = await supabase.from("smith_characters").insert(row).select("*").single();
    if (error) {
      if (avatarPath) await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);
      throw error;
    }
    return mapCharacter(data);
  },

  async updateCharacter(id, input, { avatarFile, removeAvatar = false } = {}) {
    const user = await requireUser();
    const { data: current, error: readError } = await supabase.from("smith_characters").select("avatar_path").eq("id", id).single();
    if (readError) throw readError;
    let nextAvatarPath = removeAvatar ? null : current.avatar_path;
    if (avatarFile) nextAvatarPath = await uploadAvatar(user.id, id, avatarFile);
    const languages = normalizeLanguages(input.allowedLanguages);
    const { data, error } = await supabase.from("smith_characters").update({
      name: input.name.trim(),
      brief: input.brief.trim(),
      header_prompt: input.headerPrompt.trim(),
      avatar_path: nextAvatarPath,
      allowed_languages: languages,
      preferred_language: languages.includes(input.preferredLanguage) ? input.preferredLanguage : languages[0]
    }).eq("id", id).select("*").single();
    if (error) {
      if (avatarFile && nextAvatarPath) await supabase.storage.from(AVATAR_BUCKET).remove([nextAvatarPath]);
      throw error;
    }
    if (current.avatar_path && current.avatar_path !== nextAvatarPath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([current.avatar_path]);
    }
    return mapCharacter(data);
  },

  async deleteCharacter(character) {
    await requireUser();
    const { error } = await supabase.from("smith_characters").delete().eq("id", character.id);
    if (error) throw error;
    if (character.avatarPath) await supabase.storage.from(AVATAR_BUCKET).remove([character.avatarPath]);
  },

  async listSessions() {
    await requireUser();
    const { data, error } = await supabase
      .from("smith_sessions")
      .select("*, smith_characters(*)")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return Promise.all(data.map(mapSession));
  },

  async createSession({ characterId, language, title = "New conversation" }) {
    const user = await requireUser();
    const { data, error } = await supabase.from("smith_sessions").insert({
      user_id: user.id,
      character_id: characterId,
      language,
      title
    }).select("*, smith_characters(*)").single();
    if (error) throw error;
    return mapSession(data);
  },

  async getSession(id) {
    await requireUser();
    const { data, error } = await supabase
      .from("smith_sessions")
      .select("*, smith_characters(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return mapSession(data);
  },

  async renameSession(id, title) {
    await requireUser();
    const { error } = await supabase.from("smith_sessions").update({ title: title.trim() }).eq("id", id);
    if (error) throw error;
  },

  async deleteSession(id) {
    await requireUser();
    const { error } = await supabase.from("smith_sessions").delete().eq("id", id);
    if (error) throw error;
  },

  async listMessages(sessionId) {
    await requireUser();
    const { data, error } = await supabase
      .from("smith_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  async addUserMessage(sessionId, content) {
    const user = await requireUser();
    const { data, error } = await supabase.from("smith_messages").insert({
      user_id: user.id,
      session_id: sessionId,
      role: "user",
      content: content.trim()
    }).select("*").single();
    if (error) throw error;
    return data;
  },

  async editMessage(id, content) {
    await requireUser();
    const { error } = await supabase.from("smith_messages").update({
      content: content.trim(),
      edited_at: new Date().toISOString()
    }).eq("id", id);
    if (error) throw error;
  },

  async deleteMessage(id) {
    await requireUser();
    const { error } = await supabase.from("smith_messages").delete().eq("id", id);
    if (error) throw error;
  }
};
