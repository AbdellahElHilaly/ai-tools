const STORAGE_KEY = "sb-lnvvtndwkyclayehyjfb-auth-token";
const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function storedSession() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (value?.access_token) return value;
    if (value?.currentSession?.access_token) return value.currentSession;
    if (value?.session?.access_token) return value.session;
  } catch {
    return null;
  }
  return null;
}

function saveSession(session) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

function friendlyNetworkError(error) {
  if (error?.name === "AbortError" || error?.name === "TimeoutError") {
    return new Error("The request took too long. Check your connection and try again.");
  }
  return error instanceof Error ? error : new Error("Network request failed.");
}

async function timedFetch(input, init = {}, timeout = 15000, retries = 0) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      if (attempt < retries && RETRYABLE_STATUS.has(response.status)) {
        await sleep(350 * (attempt + 1));
        continue;
      }
      return response;
    } catch (error) {
      lastError = friendlyNetworkError(error);
      if (attempt >= retries || navigator.onLine === false) throw lastError;
      await sleep(350 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

function apiError(payload, response) {
  const details = payload?.error || payload;
  const error = new Error(details?.message || response.statusText || "Request failed.");
  error.code = details?.code || String(response.status);
  error.details = details?.details;
  error.hint = details?.hint;
  error.status = response.status;
  return error;
}

function encodePath(path) {
  return String(path).split("/").map(encodeURIComponent).join("/");
}

class QueryBuilder {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.method = "GET";
    this.params = new URLSearchParams();
    this.headers = {};
    this.body = undefined;
    this.unwrap = "";
  }

  select(columns = "*") {
    this.params.set("select", columns);
    if (this.method === "GET") return this;
    this.headers.Prefer = [this.headers.Prefer, "return=representation"].filter(Boolean).join(",");
    return this;
  }

  insert(values) {
    this.method = "POST";
    this.body = values;
    return this;
  }

  update(values) {
    this.method = "PATCH";
    this.body = values;
    return this;
  }

  delete() {
    this.method = "DELETE";
    return this;
  }

  eq(column, value) {
    this.params.set(column, `eq.${value}`);
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.params.set("order", `${column}.${ascending ? "asc" : "desc"}`);
    return this;
  }

  single() {
    this.unwrap = "single";
    return this;
  }

  maybeSingle() {
    this.unwrap = "maybeSingle";
    this.params.set("limit", "1");
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    try {
      const query = this.params.toString();
      const response = await this.client.request(
        `/rest/v1/${encodeURIComponent(this.table)}${query ? `?${query}` : ""}`,
        {
          method: this.method,
          headers: this.headers,
          body: this.body === undefined ? undefined : JSON.stringify(this.body),
          timeout: this.method === "GET" ? 12000 : 20000,
          retries: this.method === "GET" ? 1 : 0
        }
      );
      const payload = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) return { data: null, error: apiError(payload, response) };
      if (this.unwrap) {
        const row = Array.isArray(payload) ? payload[0] : payload;
        if (!row && this.unwrap === "single") return { data: null, error: new Error("Expected one row.") };
        return { data: row || null, error: null };
      }
      return { data: payload, error: null };
    } catch (error) {
      return { data: null, error: friendlyNetworkError(error) };
    }
  }
}

export function createClient(baseUrl, publishableKey) {
  const listeners = new Set();
  let session = storedSession();
  let refreshPromise = null;

  async function refreshSession() {
    if (!session?.refresh_token) return null;
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      const response = await timedFetch(
        `${baseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: { apikey: publishableKey, "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: session.refresh_token })
        },
        12000
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        saveSession(null);
        session = null;
        listeners.forEach((listener) => listener("SIGNED_OUT", null));
        throw apiError(payload, response);
      }
      session = payload;
      saveSession(session);
      listeners.forEach((listener) => listener("TOKEN_REFRESHED", session));
      return session;
    })().finally(() => { refreshPromise = null; });
    return refreshPromise;
  }

  async function validSession() {
    session = storedSession();
    if (!session?.access_token) return null;
    const expiresAt = Number(session.expires_at || 0) * 1000;
    if (expiresAt && expiresAt <= Date.now() + 30000) {
      try {
        return await refreshSession();
      } catch {
        return null;
      }
    }
    return session;
  }

  async function request(path, { method = "GET", headers = {}, body, timeout = 15000, retries = 0 } = {}, retriedAuth = false) {
    const current = await validSession();
    const response = await timedFetch(
      baseUrl + path,
      {
        method,
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${current?.access_token || publishableKey}`,
          "Content-Type": "application/json",
          ...headers
        },
        body
      },
      timeout,
      retries
    );
    if (response.status === 401 && current?.refresh_token && !retriedAuth) {
      await refreshSession();
      return request(path, { method, headers, body, timeout, retries }, true);
    }
    return response;
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    session = storedSession();
    listeners.forEach((listener) => listener(session ? "SIGNED_IN" : "SIGNED_OUT", session));
  });

  return {
    request,
    auth: {
      async getSession() {
        try {
          return { data: { session: await validSession() }, error: null };
        } catch (error) {
          return { data: { session: null }, error: friendlyNetworkError(error) };
        }
      },
      async getUser() {
        const current = await validSession();
        return { data: { user: current?.user || null }, error: null };
      },
      onAuthStateChange(callback) {
        listeners.add(callback);
        queueMicrotask(() => callback("INITIAL_SESSION", session));
        return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
      }
    },
    from(table) {
      return new QueryBuilder({ request }, table);
    },
    storage: {
      from(bucket) {
        return {
          async createSignedUrl(path, expiresIn) {
            try {
              const response = await request(`/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodePath(path)}`, {
                method: "POST",
                body: JSON.stringify({ expiresIn }),
                timeout: 10000
              });
              const payload = await response.json().catch(() => null);
              if (!response.ok) return { data: null, error: apiError(payload, response) };
              const signedPath = payload?.signedURL || payload?.signedUrl;
              return { data: { signedUrl: signedPath?.startsWith("http") ? signedPath : baseUrl + signedPath }, error: null };
            } catch (error) {
              return { data: null, error: friendlyNetworkError(error) };
            }
          },
          async upload(path, file, options = {}) {
            try {
              const response = await request(`/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`, {
                method: "POST",
                headers: {
                  "Content-Type": options.contentType || file.type || "application/octet-stream",
                  "cache-control": options.cacheControl || "3600",
                  "x-upsert": String(Boolean(options.upsert))
                },
                body: file,
                timeout: 30000
              });
              const payload = await response.json().catch(() => null);
              return response.ok ? { data: payload, error: null } : { data: null, error: apiError(payload, response) };
            } catch (error) {
              return { data: null, error: friendlyNetworkError(error) };
            }
          },
          async remove(paths) {
            try {
              const response = await request(`/storage/v1/object/${encodeURIComponent(bucket)}`, {
                method: "DELETE",
                body: JSON.stringify({ prefixes: paths }),
                timeout: 15000
              });
              const payload = await response.json().catch(() => null);
              return response.ok ? { data: payload, error: null } : { data: null, error: apiError(payload, response) };
            } catch (error) {
              return { data: null, error: friendlyNetworkError(error) };
            }
          }
        };
      }
    },
    functions: {
      async invoke(name, { body } = {}) {
        try {
          const response = await request(`/functions/v1/${encodeURIComponent(name)}`, {
            method: "POST",
            body: JSON.stringify(body || {}),
            timeout: 60000
          });
          const copy = response.clone();
          const payload = await response.json().catch(() => null);
          return response.ok
            ? { data: payload, error: null }
            : { data: null, error: Object.assign(apiError(payload, response), { context: copy }) };
        } catch (error) {
          return { data: null, error: friendlyNetworkError(error) };
        }
      }
    }
  };
}
