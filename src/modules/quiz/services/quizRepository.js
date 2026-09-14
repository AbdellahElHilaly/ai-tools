import { localQuizStore } from "../../../core/storage/indexedDb";
import { supabase } from "../../../core/supabase/client";

function toRow(quiz, userId) {
  return {
    id: quiz.id,
    user_id: userId,
    title: quiz.title,
    prompt: quiz.prompt,
    description: quiz.description,
    plan: quiz.plan,
    current_session: quiz.currentSession ?? {},
    progress_by_level: quiz.progressByLevel ?? {},
    active_level_index: quiz.activeLevelIndex ?? 0,
    status: quiz.status ?? "active",
    is_saved: quiz.isSaved ?? true,
    updated_at: new Date().toISOString()
  };
}

function fromRow(row) {
  const legacySession = row.current_session;
  const progressByLevel = row.progress_by_level && Object.keys(row.progress_by_level).length
    ? row.progress_by_level
    : legacySession?.levelId
      ? { [legacySession.levelId]: legacySession }
      : {};

  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    description: row.description,
    plan: row.plan,
    currentSession: legacySession,
    progressByLevel,
    activeLevelIndex: row.active_level_index,
    status: row.status,
    isSaved: row.is_saved,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export const quizRepository = {
  async save(quiz) {
    const snapshot = { ...quiz, updatedAt: new Date().toISOString() };
    await localQuizStore.put(snapshot);
    const user = await currentUser();
    if (user) {
      const { error } = await supabase.from("quizzes").upsert(toRow(snapshot, user.id));
      if (error) throw error;
    }
    return snapshot;
  },

  async list() {
    const local = await localQuizStore.getAll();
    const user = await currentUser();
    if (!user) return local.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const { data, error } = await supabase.from("quizzes").select("*").order("updated_at", { ascending: false });
    if (error) return local;
    const merged = new Map(local.map((quiz) => [quiz.id, quiz]));
    data.map(fromRow).forEach((quiz) => merged.set(quiz.id, quiz));
    await Promise.all([...merged.values()].map((quiz) => localQuizStore.put(quiz)));
    return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    const local = await localQuizStore.get(id);
    if (local) return local;
    const user = await currentUser();
    if (!user) return null;
    const { data, error } = await supabase.from("quizzes").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    const quiz = fromRow(data);
    await localQuizStore.put(quiz);
    return quiz;
  },

  async remove(id) {
    await localQuizStore.remove(id);
    const user = await currentUser();
    if (user) await supabase.from("quizzes").delete().eq("id", id);
  }
};
