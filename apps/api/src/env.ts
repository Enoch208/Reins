import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(8787),
  ONCHAINOS_BIN: z.string().min(1).default("onchainos"),
  XLAYER_RPC_URL: z.url().default("https://rpc.xlayer.tech"),
  PAYMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv): Env {
  return envSchema.parse(source);
}
