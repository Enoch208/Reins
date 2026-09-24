import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createXLayerReader } from "../src/payments/xlayer-reader";

const payer = "0x04c98d337584f979c426f732834e921707baf1ca";

describe.skipIf(process.env.LIVE_CHAIN !== "1")("live X Layer mainnet reads", () => {
  const chain = createXLayerReader(process.env.XLAYER_RPC_URL ?? "https://rpc.xlayer.tech");

  it("reports a random nonce as unused and reads the payer's USDT0 balance", async () => {
    const head = await chain.head();
    expect(head.number).toBeGreaterThan(0n);
    const nonce = `0x${randomBytes(32).toString("hex")}`;
    expect(await chain.authorizationUsed(payer, nonce, head.number)).toBe(false);
    const balance = await chain.usdt0Balance(payer);
    expect(typeof balance).toBe("bigint");
    expect(balance).toBeGreaterThanOrEqual(0n);
    expect(
      await chain.findAuthorizationTx(payer, nonce, head.number - 150n, head.number),
    ).toBeNull();
  });
});
