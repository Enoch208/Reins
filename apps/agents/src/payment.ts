import type { AuthorizationView } from "@reins/core";

export interface PaymentReceipt {
  readonly txHash: string;
  readonly network: string;
  readonly deliverable: string | null;
}

export type PaymentOutcome =
  | { readonly kind: "SETTLED"; readonly receipt: PaymentReceipt }
  | { readonly kind: "FAILED"; readonly reason: string }
  | { readonly kind: "UNKNOWN"; readonly reason: string };

export interface PaymentExecutor {
  execute(authorization: AuthorizationView): Promise<PaymentOutcome>;
}
