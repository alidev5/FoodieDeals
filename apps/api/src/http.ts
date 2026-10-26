import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ZodSchema } from "zod";

const STATUS_NAMES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

export class HttpError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message: string) => new HttpError(401, message);
export const forbidden = (message: string) => new HttpError(403, message);
export const notFound = (message: string) => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
export const unavailable = (message: string) => new HttpError(503, message);

/** Same error body the apps already parse: `{ statusCode, error, message, path, timestamp }`. */
export function errorResponse(error: unknown, c: Context) {
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) {
    console.error(`${c.req.method} ${c.req.path}`, error);
  }

  return c.json(
    {
      statusCode: status,
      error: STATUS_NAMES[status] ?? "Error",
      message: error instanceof HttpError ? error.message : "Internal server error",
      path: c.req.path,
      timestamp: new Date().toISOString(),
    },
    status,
  );
}

export function parseWith<T>(schema: ZodSchema<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw badRequest(result.error.issues.map((issue) => issue.message).join(", "));
  }
  return result.data;
}

export async function readJson<T>(c: Context, schema: ZodSchema<T>): Promise<T> {
  const body: unknown = await c.req.json().catch(() => {
    throw badRequest("Request body must be JSON");
  });
  return parseWith(schema, body);
}
