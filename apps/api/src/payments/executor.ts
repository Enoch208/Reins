import { z } from "zod";
import { runJson, type CliRunner } from "./cli";
import {
  decodeSignedAuthorization,
  paymentSignatureHeader,
  type PaymentTerms,
  type SignedAuthorization,
} from "./x402";

export interface SignedPayment {
  readonly paymentSignature: string;
  readonly authorization: SignedAuthorization;
}

export interface PaymentExecutor {
  sign(terms: PaymentTerms): Promise<SignedPayment>;
}

export class SigningFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SigningFailed";
  }
}

const signOutputSchema = z.object({
  authorization_header: z.string().min(1),
  header_name: z.literal(paymentSignatureHeader),
});

export class OnchainosExecutor implements PaymentExecutor {
  readonly #cli: CliRunner;

  constructor(cli: CliRunner) {
    this.#cli = cli;
  }

  async sign(terms: PaymentTerms): Promise<SignedPayment> {
    const outcome = await runJson(this.#cli, [
      "payment",
      "pay",
      "--payload",
      terms.paymentRequired,
      "--selected-index",
      String(terms.index),
    ]);
    if (!outcome.ok) {
      throw new SigningFailed(outcome.error);
    }
    const output = signOutputSchema.safeParse(outcome.data);
    if (!output.success) {
      throw new SigningFailed("onchainos returned no PAYMENT-SIGNATURE header");
    }
    const authorization = decodeSignedAuthorization(output.data.authorization_header);
    if (authorization === null) {
      throw new SigningFailed("The PAYMENT-SIGNATURE header carries no EIP-3009 authorization");
    }
    return { paymentSignature: output.data.authorization_header, authorization };
  }
}
