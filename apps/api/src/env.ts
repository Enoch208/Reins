import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().min(1).default("127.0.0.1"),
  ONCHAINOS_BIN: z.string().min(1).default("onchainos"),
  XLAYER_RPC_URL: z.url().default("https://rpc.xlayer.tech"),
  PAYMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  OPERATOR_KEY: z.string().min(32).optional(),
  ALLOWED_SERVICE_ORIGINS: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url().transform((url) => new URL(url).origin)).min(1))
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv): Env {
  return envSchema.parse(source);
}
