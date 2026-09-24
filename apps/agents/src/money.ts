import { parseMicros, type DecimalAmount } from "@reins/core";

export function sameAmount(left: DecimalAmount, right: DecimalAmount): boolean {
  const leftMicros = parseMicros(left);
  return leftMicros !== null && leftMicros === parseMicros(right);
}
