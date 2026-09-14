import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { publicConfig } from "../config/publicConfig";
import { withTimeout } from "../network/asyncPolicy";
import { supabase } from "./client";

const AuthContext = createContext(null);
const AUTH_TIMEOUT = 10000;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.getSession(),
        AUTH_TIMEOUT,
        "Session check took too long."
      );
      if (error) throw error;
      setSession(data.session);
      return data.session;
    } catch (error) {
      setSession(null);
      setAuthError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    refreshSession();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthError(null);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [refreshSession]);

  const ensureSession = useCallback(async () => {
    const { data, error } = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT);
    if (error) throw error;
    if (data.session) return data.session;
    const authRequired = new Error("Sign in first to use AI and save your progress.");
    authRequired.code = "AUTH_REQUIRED";
    throw authRequired;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 15000);
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await withTimeout(supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: publicConfig.appUrl }
    }), 15000);
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await withTimeout(supabase.auth.signOut(), 15000);
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      authError,
      refreshSession,
      ensureSession,
      signIn,
      signUp,
      signOut
    }),
    [session, loading, authError, refreshSession, ensureSession, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
