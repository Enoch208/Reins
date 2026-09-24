import type { ChainHead, ChainReader, ReceiptLookup } from "../src/payments/chain";

export class FakeChain implements ChainReader {
  blockNumber = 1_000n;
  timestampSeconds = BigInt(Math.floor(Date.now() / 1000));
  readonly receipts = new Map<string, ReceiptLookup>();
  readonly usedNonces = new Map<string, string>();
  readonly balances = new Map<string, bigint>();

  reset(): void {
    this.blockNumber = 1_000n;
    this.timestampSeconds = BigInt(Math.floor(Date.now() / 1000));
    this.receipts.clear();
    this.usedNonces.clear();
    this.balances.clear();
  }

  head(): Promise<ChainHead> {
    return Promise.resolve({ number: this.blockNumber, timestampSeconds: this.timestampSeconds });
  }

  receipt(txHash: string): Promise<ReceiptLookup> {
    return Promise.resolve(this.receipts.get(txHash) ?? { status: "NOT_FOUND" });
  }

  authorizationUsed(payer: string, nonce: string): Promise<boolean> {
    return Promise.resolve(this.usedNonces.has(`${payer.toLowerCase()}:${nonce}`));
  }

  findAuthorizationTx(payer: string, nonce: string): Promise<string | null> {
    return Promise.resolve(this.usedNonces.get(`${payer.toLowerCase()}:${nonce}`) ?? null);
  }

  usdt0Balance(address: string): Promise<bigint> {
    return Promise.resolve(this.balances.get(address.toLowerCase()) ?? 0n);
  }

  useAuthorization(payer: string, nonce: string, txHash: string): void {
    this.usedNonces.set(`${payer.toLowerCase()}:${nonce}`, txHash);
  }
}
