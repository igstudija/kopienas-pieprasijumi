export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers,
  });

  const text = response.status === 204 ? "" : await response.text();
  const data = parseJson(text);

  if (!response.ok) {
    throw new ApiError(apiErrorMessage(data) ?? `Request failed (${response.status}).`, response.status);
  }

  return data as T;
}

export function jsonRequest(method: string, body?: unknown, init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return {
    ...init,
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function parseJson(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function apiErrorMessage(data: unknown) {
  if (!data || typeof data !== "object" || !("error" in data)) return null;
  return typeof data.error === "string" && data.error.trim() ? data.error : null;
}
