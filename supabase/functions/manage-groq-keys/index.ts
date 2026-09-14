import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";
const allowedOrigins = new Set([
  "https://abdellahelhilaly.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

type SupabaseClient = ReturnType<typeof createClient>;

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : "https://abdellahelhilaly.github.io";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" }
  });
}

function apiError(code: string, message: string, retryable: boolean, status: number, origin: string | null) {
  return json({ error: { code, message, retryable } }, status, origin);
}

function adminClient() {
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  return createClient(
    Deno.env.get("SUPABASE_URL") || "",
    secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization) return null;

  const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    publishableKeys.default || Deno.env.get("SUPABASE_ANON_KEY") || "",
    { global: { headers: { Authorization: authorization } } }
  );
  const token = authorization.replace(/^Bearer\s+/i, "");
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

function cleanLabel(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 40) : "";
}

function cleanApiKey(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validKeyShape(apiKey: string) {
  return apiKey.length >= 20 && apiKey.length <= 240 && /^gsk_[A-Za-z0-9_-]+$/.test(apiKey);
}

function keyHint(apiKey: string) {
  return `gsk_••••${apiKey.slice(-4)}`;
}

async function testGroqKey(apiKey: string) {
  try {
    const response = await fetch(GROQ_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(12_000)
    });

    if (response.ok) return { valid: true, message: "المفتاح صالح ومتصل بـGroq." };
    if (response.status === 429) return { valid: true, message: "المفتاح صالح، لكن وصل مؤقتاً لحد الاستعمال." };
    if (response.status === 401 || response.status === 403) return { valid: false, message: "المفتاح غير صالح أو تم إلغاؤه." };
    return { valid: null, message: "Groq غير متاحة مؤقتاً. عاود الاختبار من بعد." };
  } catch {
    return { valid: null, message: "تعذر الاتصال بـGroq. تحقق من الإنترنت وعاود." };
  }
}

async function listKeys(admin: SupabaseClient, userId: string) {
  return await admin
    .from("groq_api_keys")
    .select("id,label,key_hint,status,last_tested_at,last_test_message,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return apiError("METHOD_NOT_ALLOWED", "Method not allowed", false, 405, origin);

  try {
    const user = await authenticatedUser(request);
    if (!user) return apiError("AUTH_REQUIRED", "سجّل الدخول أولاً لإدارة مفاتيح Groq.", false, 401, origin);

    const body = await request.json();
    const operation = body?.operation;
    const admin = adminClient();

    if (operation === "list") {
      const { data, error } = await listKeys(admin, user.id);
      if (error) throw error;
      return json({ data: { keys: data || [] } }, 200, origin);
    }

    if (operation === "save") {
      const apiKey = cleanApiKey(body?.apiKey);
      const label = cleanLabel(body?.label) || "Groq";
      if (!validKeyShape(apiKey)) {
        return apiError("INVALID_KEY_FORMAT", "مفتاح Groq خاصو يبدأ بـ gsk_ ويكون مكتمل.", false, 400, origin);
      }

      const { data: keyId, error } = await admin.rpc("save_groq_api_key", {
        target_user: user.id,
        target_label: label,
        target_key: apiKey,
        target_hint: keyHint(apiKey)
      });
      if (error) {
        if (error.message.includes("groq_key_limit_reached")) {
          return apiError("KEY_LIMIT", "يمكنك حفظ 10 مفاتيح كحد أقصى.", false, 409, origin);
        }
        throw error;
      }
      return json({ data: { id: keyId, message: "تم حفظ المفتاح مشفراً. اختبره قبل الاستعمال." } }, 201, origin);
    }

    if (operation === "test") {
      const keyId = typeof body?.keyId === "string" ? body.keyId : null;
      let apiKey = cleanApiKey(body?.apiKey);
      if (!apiKey && keyId) {
        const { data, error } = await admin.rpc("read_groq_api_key", {
          target_user: user.id,
          target_key_id: keyId
        });
        if (error) throw error;
        apiKey = data || "";
      }
      if (!validKeyShape(apiKey)) {
        return apiError("KEY_NOT_FOUND", "المفتاح غير موجود أو صيغته غير صالحة.", false, 404, origin);
      }

      const result = await testGroqKey(apiKey);
      if (keyId && result.valid !== null) {
        const { error } = await admin.rpc("set_groq_api_key_test_result", {
          target_user: user.id,
          target_key_id: keyId,
          target_status: result.valid ? "valid" : "invalid",
          target_message: result.message
        });
        if (error) throw error;
      }
      if (result.valid === null) return apiError("GROQ_UNAVAILABLE", result.message, true, 503, origin);
      return json({ data: result }, 200, origin);
    }

    if (operation === "delete") {
      const keyId = typeof body?.keyId === "string" ? body.keyId : "";
      if (!keyId) return apiError("INVALID_REQUEST", "حدد المفتاح المراد حذفه.", false, 400, origin);
      const { data: deleted, error } = await admin.rpc("delete_groq_api_key", {
        target_user: user.id,
        target_key_id: keyId
      });
      if (error) throw error;
      if (!deleted) return apiError("KEY_NOT_FOUND", "المفتاح غير موجود.", false, 404, origin);
      return json({ data: { deleted: true } }, 200, origin);
    }

    return apiError("INVALID_OPERATION", "العملية غير صالحة.", false, 400, origin);
  } catch (error) {
    console.error("Groq key management error", error instanceof Error ? error.message : "unknown");
    return apiError("UNEXPECTED_ERROR", "تعذر تنفيذ العملية الآن. حاول مرة أخرى.", true, 500, origin);
  }
});
