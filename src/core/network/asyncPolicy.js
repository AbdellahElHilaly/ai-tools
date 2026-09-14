export class NetworkTimeoutError extends Error {
  constructor(message = "The request took too long. Check your connection and try again.") {
    super(message);
    this.name = "NetworkTimeoutError";
    this.code = "NETWORK_TIMEOUT";
    this.retryable = true;
  }
}

export function timeoutSignal(timeoutMs = 12000) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

export function withTimeout(task, timeoutMs = 15000, message) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new NetworkTimeoutError(message)), timeoutMs);
  });
  return Promise.race([Promise.resolve(task), guard]).finally(() => clearTimeout(timer));
}

function isRetryable(error) {
  return error?.retryable === true
    || error?.name === "AbortError"
    || error?.name === "TimeoutError"
    || error instanceof TypeError
    || [408, 429, 502, 503, 504].includes(Number(error?.status || error?.code));
}

export async function retryRead(operation, { attempts = 2, delayMs = 350 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || navigator.onLine === false || attempt === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}
