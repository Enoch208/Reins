import type { FacilitatorClient } from "@okxweb3/x402-core/server";
import type {
  Network,
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  SupportedResponse,
  VerifyResponse,
} from "@okxweb3/x402-core/types";

export const fixturePayer = "0x00000000000000000000000000000000000000aa";
export const fixtureTransaction = `0x${"ab".repeat(32)}`;

export class FakeFacilitator implements FacilitatorClient {
  readonly settled: PaymentRequirements[] = [];
  readonly verified: PaymentRequirements[] = [];

  private readonly network: Network;
  private readonly paymentIsValid: boolean;

  constructor(network: Network, paymentIsValid = true) {
    this.network = network;
    this.paymentIsValid = paymentIsValid;
  }

  getSupported(): Promise<SupportedResponse> {
    return Promise.resolve({
      kinds: [{ x402Version: 2, scheme: "exact", network: this.network }],
      extensions: [],
      signers: {},
    });
  }

  verify(_payload: PaymentPayload, requirements: PaymentRequirements): Promise<VerifyResponse> {
    this.verified.push(requirements);
    return Promise.resolve(
      this.paymentIsValid
        ? { isValid: true, payer: fixturePayer }
        : { isValid: false, invalidReason: "invalid_exact_evm_payload_signature" },
    );
  }

  settle(_payload: PaymentPayload, requirements: PaymentRequirements): Promise<SettleResponse> {
    this.settled.push(requirements);
    return Promise.resolve({
      success: true,
      status: "success",
      payer: fixturePayer,
      transaction: fixtureTransaction,
      network: requirements.network,
    });
  }
}
