import { Resolver } from "node:dns/promises";
import type { FetchLike } from "./snapshot";

const resolver = new Resolver({ timeout: 2_000, tries: 1 });

async function assertResolvable(hostname: string): Promise<void> {
  try {
    await Promise.any([resolver.resolve4(hostname), resolver.resolve6(hostname)]);
  } catch (error) {
    throw new Error(`DNS lookup for ${hostname} failed`, { cause: error });
  }
}

export const dnsCheckedFetch: FetchLike = async (url, init) => {
  await assertResolvable(new URL(url).hostname);
  return fetch(url, init);
};
