import type { ReactNode } from "react";
import { getWallet } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { WalletContext } from "@/lib/wallet-context";

const walletPollMs = 15_000;

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useResource("wallet", getWallet, walletPollMs);
  return <WalletContext value={wallet}>{children}</WalletContext>;
}
