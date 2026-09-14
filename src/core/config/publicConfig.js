export const publicConfig = Object.freeze({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "https://lnvvtndwkyclayehyjfb.supabase.co",
  supabasePublishableKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_ZDsw4K4lHDzWuYo7Y2XkNA_EcSI6zc4",
  appUrl:
    import.meta.env.VITE_APP_URL || new URL(import.meta.env.BASE_URL, window.location.origin).href,
  defaultModel: "openai/gpt-oss-120b",
  appName: "AI Tools"
});
