import { useCallback, useEffect, useRef, useState } from "react";

export interface Resource<T> {
  readonly data: T | null;
  readonly error: Error | null;
  readonly loading: boolean;
  readonly reload: () => void;
}

export function useResource<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  pollMs: number | null = null,
): Resource<T> {
  const loadRef = useRef(load);
  const [data, setData] = useState<{ key: string; value: T } | null>(null);
  const [error, setError] = useState<{ key: string; value: Error } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;

    const run = () => {
      void loadRef
        .current(controller.signal)
        .then(
          (value) => {
            setData({ key, value });
            setError(null);
          },
          (cause: unknown) => {
            if (controller.signal.aborted) return;
            setError({ key, value: cause instanceof Error ? cause : new Error(String(cause)) });
          },
        )
        .finally(() => {
          if (pollMs !== null && !controller.signal.aborted) timer = window.setTimeout(run, pollMs);
        });
    };

    run();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [key, pollMs, tick]);

  const reload = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  const current = data?.key === key ? data.value : null;
  const currentError = error?.key === key ? error.value : null;

  return {
    data: current,
    error: currentError,
    loading: current === null && currentError === null,
    reload,
  };
}
