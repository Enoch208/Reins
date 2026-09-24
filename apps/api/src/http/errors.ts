import type { ApiError } from "@reins/core";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;

  constructor(status: ContentfulStatusCode, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }

  toBody(): ApiError {
    return { error: this.code, message: this.message };
  }
}

export function notFound(what: string, id: string): HttpError {
  return new HttpError(404, "NOT_FOUND", `${what} ${id} does not exist`);
}

export function illegalState(code: string, message: string): HttpError {
  return new HttpError(409, code, message);
}

export function invalidRequest(message: string): HttpError {
  return new HttpError(400, "VALIDATION_FAILED", message);
}
