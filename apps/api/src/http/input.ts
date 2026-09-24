import type { Context } from "hono";
import { z } from "zod";
import { invalidRequest, notFound } from "./errors";

const idSchema = z.uuid();

export function isUuid(value: string): boolean {
  return idSchema.safeParse(value).success;
}

export function pathId(c: Context, what: string): string {
  const id = c.req.param("id") ?? "";
  if (!isUuid(id)) {
    throw notFound(what, id);
  }
  return id;
}

export async function readBody<Schema extends z.ZodType>(
  c: Context,
  schema: Schema,
): Promise<z.output<Schema>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw invalidRequest("Request body must be valid JSON");
    }
    throw error;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw invalidRequest(z.prettifyError(parsed.error));
  }
  return parsed.data;
}
