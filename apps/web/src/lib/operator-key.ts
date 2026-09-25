import { useSyncExternalStore } from "react";

const storageKey = "reins.operatorKey";
const listeners = new Set<() => void>();

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readOperatorKey(): string | null {
  return storage()?.getItem(storageKey) ?? null;
}

export function saveOperatorKey(key: string | null): void {
  const store = storage();
  if (key === null) store?.removeItem(storageKey);
  else store?.setItem(storageKey, key);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useOperatorKey(): string | null {
  return useSyncExternalStore(subscribe, readOperatorKey, () => null);
}
