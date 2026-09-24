import { formatMicros, parseMicros, type DecimalAmount } from "@reins/core";

export function formatAmount(amount: DecimalAmount): string {
  const micros = parseMicros(amount);
  return micros === null ? amount : formatMicros(micros);
}

export function shareOf(part: DecimalAmount, total: DecimalAmount): number {
  const whole = parseMicros(total);
  const piece = parseMicros(part);
  if (whole === null || piece === null || whole === 0) return 0;
  return Math.round((piece * 10_000) / whole) / 100;
}

export function microsOf(amount: DecimalAmount): number {
  return parseMicros(amount) ?? 0;
}

export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part * 10_000) / whole) / 100;
}
