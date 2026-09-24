import type { WalletView } from "@reins/core";
import { createContext, useContext } from "react";
import type { Resource } from "./use-resource";

export const WalletContext = createContext<Resource<WalletView> | null>(null);

export function useWallet(): Resource<WalletView> {
  const wallet = useContext(WalletContext);
  if (wallet === null) throw new Error("useWallet needs a WalletProvider above it.");
  return wallet;
}
