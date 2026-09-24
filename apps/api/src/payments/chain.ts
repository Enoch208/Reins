export interface TokenTransfer {
  readonly from: string;
  readonly to: string;
  readonly value: bigint;
}

export type ReceiptLookup =
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "REVERTED" }
  | { readonly status: "SUCCESS"; readonly transfers: readonly TokenTransfer[] };

export interface ChainHead {
  readonly number: bigint;
  readonly timestampSeconds: bigint;
}

export interface ChainReader {
  head(): Promise<ChainHead>;
  receipt(txHash: string): Promise<ReceiptLookup>;
  authorizationUsed(payer: string, nonce: string, atBlock: bigint): Promise<boolean>;
  findAuthorizationTx(
    payer: string,
    nonce: string,
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<string | null>;
  usdt0Balance(address: string): Promise<bigint>;
}

export interface ExpectedTransfer {
  readonly from: string;
  readonly to: string;
  readonly amountMicros: number;
}

export function confirmsTransfer(lookup: ReceiptLookup, expected: ExpectedTransfer): boolean {
  if (lookup.status !== "SUCCESS") {
    return false;
  }
  return lookup.transfers.some(
    (transfer) =>
      transfer.from.toLowerCase() === expected.from.toLowerCase() &&
      transfer.to.toLowerCase() === expected.to.toLowerCase() &&
      transfer.value === BigInt(expected.amountMicros),
  );
}
