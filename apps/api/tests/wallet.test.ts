import { isWalletView, type WalletView } from "@reins/core";
import { describe, expect, it } from "vitest";
import { payerAddress } from "./fake-cli";
import { call, fakeChain, fakeCli, resetDatabaseBetweenTests } from "./support";

resetDatabaseBetweenTests();

async function wallet(): Promise<WalletView> {
  const reply = await call<WalletView>("GET", "/wallet");
  expect(reply.status).toBe(200);
  expect(isWalletView(reply.body)).toBe(true);
  return reply.body;
}

const xLayer = { network: "eip155:196", networkName: "X Layer", asset: "USDT0" };

describe("GET /wallet", () => {
  it("is READY with the X Layer address and the on-chain USDT0 balance", async () => {
    fakeChain.balances.set(payerAddress, 1_250_000n);
    expect(await wallet()).toEqual({
      ...xLayer,
      status: "READY",
      address: payerAddress,
      balance: "1.25",
      explorerUrl: `https://www.oklink.com/xlayer/address/${payerAddress}`,
    });
  });

  it("reports an unfunded wallet as 0.00", async () => {
    expect((await wallet()).balance).toBe("0.00");
  });

  it("is LOGGED_OUT when the CLI session is gone", async () => {
    fakeCli.loggedIn = false;
    expect(await wallet()).toEqual({
      ...xLayer,
      status: "LOGGED_OUT",
      address: null,
      balance: null,
      explorerUrl: null,
    });
  });

  it("is NOT_INSTALLED when the CLI binary is missing", async () => {
    fakeCli.installed = false;
    expect((await wallet()).status).toBe("NOT_INSTALLED");
  });
});
