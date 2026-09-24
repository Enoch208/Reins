import type { CSSProperties } from "react";

export function revealDelay(seconds: number | null): CSSProperties | undefined {
  return seconds === null ? undefined : { transitionDelay: `${String(seconds)}s` };
}
