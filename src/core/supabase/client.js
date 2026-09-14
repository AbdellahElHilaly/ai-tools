import { createClient } from "@supabase/supabase-js";
import { publicConfig } from "../config/publicConfig";

export const supabase = createClient(publicConfig.supabaseUrl, publicConfig.supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
