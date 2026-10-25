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

async function request<T>(baseUrl: string, path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
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
    post: (path, body) => request(baseUrl, path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
    patch: (path, body) => request(baseUrl, path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  };
}
