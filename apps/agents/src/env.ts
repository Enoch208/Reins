import { z } from "zod";

const envSchema = z.object({
  REINS_API_URL: z.url(),
  PAID_SERVICE_URL: z.url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export class EnvError extends Error {
  override readonly name = "EnvError";
}

export function loadEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new EnvError(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
