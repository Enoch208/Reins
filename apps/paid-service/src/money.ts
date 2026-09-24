const decimalPattern = /^(\d+)(?:\.(\d+))?$/;

export function toAtomicUnits(decimal: string, decimals: number): string {
  const match = decimalPattern.exec(decimal);
  const whole = match?.[1];
  if (whole === undefined) {
    throw new Error(`Not a decimal amount: ${decimal}`);
  }
  const fraction = match?.[2] ?? "";
  if (fraction.length > decimals) {
    throw new Error(`${decimal} has more than ${String(decimals)} decimal places`);
  }
  const scale = 10n ** BigInt(decimals);
  return (BigInt(whole) * scale + BigInt(fraction.padEnd(decimals, "0") || "0")).toString();
}
