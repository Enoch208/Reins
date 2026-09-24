import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/env";

const credentials = { OKX_API_KEY: "k", OKX_SECRET_KEY: "s", OKX_PASSPHRASE: "p" };

describe("loadEnv", () => {
  it("refuses to start when the facilitator credentials are missing", () => {
    const result = loadEnv({});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toHaveLength(3);
    for (const name of ["OKX_API_KEY", "OKX_SECRET_KEY", "OKX_PASSPHRASE"]) {
      expect(result.problems.some((problem) => problem.startsWith(name))).toBe(true);
    }
  });

  it("refuses blank credentials, as left by .env.example", () => {
    const result = loadEnv({ OKX_API_KEY: "", OKX_SECRET_KEY: " ", OKX_PASSPHRASE: "" });
    expect(result.ok).toBe(false);
  });

  it("defaults to X Layer mainnet, 0.01 USDT0, the Reins payTo and port 4021", () => {
    const result = loadEnv(credentials);
    if (!result.ok) throw new Error(result.problems.join("; "));
    expect(result.env.port).toBe(4021);
    expect(result.env.pricing).toMatchObject({
      network: "eip155:196",
      price: "0.01",
      amountAtomic: "10000",
      payTo: "0x10eb4e5303af6bc785dbea34052298fa9f652d87",
    });
    expect(result.env.pricing.asset.address).toBe("0x779ded0c9e1022225f8e0630b35a9b54be713736");
  });

  it("rejects an unknown network, a bad address and a zero price", () => {
    expect(loadEnv({ ...credentials, NETWORK: "eip155:1" }).ok).toBe(false);
    expect(loadEnv({ ...credentials, PAY_TO: "0x1234" }).ok).toBe(false);
    expect(loadEnv({ ...credentials, PRICE: "0" }).ok).toBe(false);
    expect(loadEnv({ ...credentials, PRICE: "0.0000001" }).ok).toBe(false);
  });
});
