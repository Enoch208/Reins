import { type RefObject, useLayoutEffect } from "react";
import { prefersReducedMotion } from "./reduced-motion";

const revealLine = 0.85;
const scrolledAfter = 40;

export function useLandingMotion(rootRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const targets = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    const reveal = (): void => {
      const limit = window.innerHeight * revealLine;
      for (const target of targets) {
        if (target.getBoundingClientRect().top < limit) target.classList.add("is-in");
      }
    };

    reveal();
    root.dataset.motion = "on";
    const loaded = requestAnimationFrame(() => {
      root.classList.add("is-loaded");
    });

    let pending = 0;
    const schedule = (): void => {
      if (pending !== 0) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        reveal();
        root.classList.toggle("is-scrolled", window.scrollY > scrolledAfter);
      });
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(loaded);
      cancelAnimationFrame(pending);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete root.dataset.motion;
      root.classList.remove("is-loaded", "is-scrolled");
      for (const target of targets) target.classList.remove("is-in");
    };
  }, [rootRef]);
}
