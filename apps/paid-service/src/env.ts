import { z } from "zod";
import { toAtomicUnits } from "./money";
import { supportedNetworks, usdt0ByNetwork, type StablecoinAsset } from "./networks";

const missingCredential = "is required: an OKX Web3 Dev Portal facilitator credential";

const requiredSecret = z.string({ error: missingCredential }).trim().min(1, missingCredential);

const envSchema = z.object({
  OKX_API_KEY: requiredSecret,
  OKX_SECRET_KEY: requiredSecret,
  OKX_PASSPHRASE: requiredSecret,
  PAY_TO: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, "must be a 0x-prefixed 20-byte address")
    .default("0x10eb4e5303af6bc785dbea34052298fa9f652d87"),
  NETWORK: z.enum(supportedNetworks).default("eip155:196"),
  PORT: z.coerce.number().int().positive().default(4021),
  HOST: z.string().min(1).default("127.0.0.1"),
  PRICE: z
    .string()
    .regex(/^\d+(\.\d{1,6})?$/, "must be a decimal USDT0 amount with at most 6 decimals")
    .refine((value) => !/^0+(\.0+)?$/.test(value), "must be greater than zero")
    .default("0.01"),
});

export interface FacilitatorCredentials {
  readonly apiKey: string;
  readonly secretKey: string;
  readonly passphrase: string;
}

export interface Pricing {
  readonly payTo: string;
  readonly network: (typeof supportedNetworks)[number];
  readonly price: string;
  readonly amountAtomic: string;
  readonly asset: StablecoinAsset;
}

export interface Env {
  readonly port: number;
  readonly host: string;
  readonly credentials: FacilitatorCredentials;
  readonly pricing: Pricing;
}

export type EnvResult =
  | { readonly ok: true; readonly env: Env }
  | { readonly ok: false; readonly problems: readonly string[] };

export function loadEnv(source: NodeJS.ProcessEnv): EnvResult {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`),
    };
  }
  const values = parsed.data;
  const asset = usdt0ByNetwork[values.NETWORK];
  return {
    ok: true,
    env: {
      port: values.PORT,
      host: values.HOST,
      credentials: {
        apiKey: values.OKX_API_KEY,
        secretKey: values.OKX_SECRET_KEY,
        passphrase: values.OKX_PASSPHRASE,
      },
      pricing: {
        payTo: values.PAY_TO,
        network: values.NETWORK,
        price: values.PRICE,
        amountAtomic: toAtomicUnits(values.PRICE, asset.decimals),
        asset,
      },
    },
  };
}
