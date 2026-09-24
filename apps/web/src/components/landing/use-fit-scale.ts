import { type RefObject, useLayoutEffect } from "react";

export function useFitScale(targetRef: RefObject<HTMLElement | null>, designWidth: number): void {
  useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    const apply = (): void => {
      target.style.setProperty("--fit", String(target.clientWidth / designWidth));
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [targetRef, designWidth]);
}
