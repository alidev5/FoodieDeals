export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
}

/**
 * Joins the API base URL and a request path. A query string on the base URL (the Supabase
 * function region pin) is carried over to every request.
 */
export function joinApiUrl(baseUrl: string, path: string): string {
  const [base, baseQuery] = baseUrl.split("?");
  if (!baseQuery) return `${base}${path}`;
  return `${base}${path}${path.includes("?") ? "&" : "?"}${baseQuery}`;
}

async function request<T>(baseUrl: string, path: string, init: RequestInit): Promise<T> {
  const response = await fetch(joinApiUrl(baseUrl, path), {
    ...init,
    // Only requests with a body declare JSON: a bodiless GET then needs no CORS preflight in
    // the browser, which would otherwise double every request's round trip.
    headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function createApiClient(baseUrl: string): ApiClient {
  return {
    get: (path) => request(baseUrl, path, { method: "GET" }),
    post: (path, body) =>
      request(baseUrl, path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
    patch: (path, body) =>
      request(baseUrl, path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  };
}
