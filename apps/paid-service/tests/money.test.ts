import { describe, expect, it } from "vitest";
import { toAtomicUnits } from "../src/money";

describe("toAtomicUnits", () => {
  it("converts decimal USDT0 prices to 6-decimal atomic units without floats", () => {
    expect(toAtomicUnits("0.01", 6)).toBe("10000");
    expect(toAtomicUnits("1", 6)).toBe("1000000");
    expect(toAtomicUnits("0.000001", 6)).toBe("1");
    expect(toAtomicUnits("123456789.123456", 6)).toBe("123456789123456");
  });

  it("rejects malformed amounts and excess precision", () => {
    expect(() => toAtomicUnits("0.0000001", 6)).toThrow();
    expect(() => toAtomicUnits("-1", 6)).toThrow();
    expect(() => toAtomicUnits("1e-2", 6)).toThrow();
    expect(() => toAtomicUnits("", 6)).toThrow();
  });
});
