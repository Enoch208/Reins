import { createHash, timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { serviceNotAllowed, unauthorized } from "./errors";

export interface Security {
  readonly operatorKey: string | null;
  readonly allowedServiceOrigins: readonly string[] | null;
}

export const openSecurity: Security = { operatorKey: null, allowedServiceOrigins: null };

const readOnlyMethods = new Set(["GET", "HEAD", "OPTIONS"]);

const digest = (value: string): Buffer => createHash("sha256").update(value).digest();

function presentedKey(header: string | undefined): string | null {
  if (header === undefined) return null;
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token !== undefined && token.length > 0 ? token : null;
}

export function requireOperatorKey(security: Security): MiddlewareHandler {
  return async (c, next) => {
    if (security.operatorKey === null || readOnlyMethods.has(c.req.method)) {
      await next();
      return;
    }
    const key = presentedKey(c.req.header("authorization"));
    if (key === null || !timingSafeEqual(digest(key), digest(security.operatorKey))) {
      throw unauthorized();
    }
    await next();
  };
}

export function assertServiceAllowed(security: Security, url: string): void {
  if (security.allowedServiceOrigins === null) return;
  const origin = new URL(url).origin;
  if (!security.allowedServiceOrigins.includes(origin)) {
    throw serviceNotAllowed(origin);
  }
}
