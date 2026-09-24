import { describe, expect, it } from "vitest";
import { formatMicros, parseMicros } from "../src/money";

describe("parseMicros", () => {
  it.each([
    ["0.40", 400_000],
    ["1", 1_000_000],
    ["0.125", 125_000],
    ["0", 0],
    ["0.000001", 1],
    ["12.5", 12_500_000],
    ["9007199254.740991", Number.MAX_SAFE_INTEGER],
  ])("parses %s to %i micros", (input, expected) => {
    expect(parseMicros(input)).toBe(expected);
  });

  it.each([
    "-1",
    "-0.40",
    "0.0000001",
    "abc",
    "",
    " 1",
    "1 ",
    "1.",
    ".5",
    "01",
    "1e3",
    "0x10",
    "1,5",
    "+1",
    "9007199254.740992",
    "100000000000000000000",
  ])("rejects %j", (input) => {
    expect(parseMicros(input)).toBeNull();
  });
});

describe("formatMicros", () => {
  it.each([
    [400_000, "0.40"],
    [1_000_000, "1.00"],
    [125_000, "0.125"],
    [0, "0.00"],
    [1, "0.000001"],
    [12_500_000, "12.50"],
    [-200_000, "-0.20"],
  ])("formats %i as %s", (input, expected) => {
    expect(formatMicros(input)).toBe(expected);
  });

  it("rejects non-integers and unsafe integers", () => {
    expect(() => formatMicros(0.5)).toThrow(RangeError);
    expect(() => formatMicros(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => formatMicros(Number.NaN)).toThrow(RangeError);
  });

  it("round-trips every formatted value", () => {
    for (const micros of [1, 10, 999_999, 1_000_001, 400_000, 123_456_789]) {
      expect(parseMicros(formatMicros(micros))).toBe(micros);
    }
  });
});
