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

export function unauthorized(): HttpError {
  return new HttpError(
    401,
    "OPERATOR_KEY_REQUIRED",
    "This action needs the operator key as a Bearer token",
  );
}

export function serviceNotAllowed(origin: string): HttpError {
  return new HttpError(
    403,
    "SERVICE_ORIGIN_NOT_ALLOWED",
    `Reins is not allowed to pay ${origin}; add it to the operator's allowed services`,
  );
}
