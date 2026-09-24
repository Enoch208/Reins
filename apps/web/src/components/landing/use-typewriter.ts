import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./reduced-motion";

export interface TypedSegment {
  readonly text: string;
  readonly delay: number;
  readonly step: number;
}

export function useTypewriter(segments: readonly TypedSegment[]): readonly string[] {
  const [shown, setShown] = useState<readonly string[]>(() =>
    segments.map((segment) => (prefersReducedMotion() ? segment.text : "")),
  );

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timers = segments.flatMap((segment, index) =>
      Array.from({ length: segment.text.length }, (_, typed) =>
        window.setTimeout(
          () => {
            setShown((current) =>
              current.map((value, at) => (at === index ? segment.text.slice(0, typed + 1) : value)),
            );
          },
          segment.delay + segment.step * typed,
        ),
      ),
    );
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [segments]);

  return shown;
}
