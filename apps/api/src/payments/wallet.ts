import { formatMicros, type WalletStatus, type WalletView } from "@reins/core";
import { z } from "zod";
import { HttpError } from "../http/errors";
import type { ChainReader } from "./chain";
import { CliNotInstalled, runJson, type CliRunner } from "./cli";
import { messageOf } from "./probe";
import { explorerAddressUrl, usdt0Asset, xLayerNetwork, xLayerNetworkName } from "./xlayer";

const statusSchema = z.object({ loggedIn: z.boolean() });
const addressesSchema = z.object({
  xlayer: z.array(z.object({ address: z.string(), chainIndex: z.string() })),
});

function view(status: WalletStatus, address: string | null, balance: string | null): WalletView {
  return {
    status,
    network: xLayerNetwork,
    networkName: xLayerNetworkName,
    asset: usdt0Asset,
    address,
    balance,
    explorerUrl: address === null ? null : explorerAddressUrl(address),
  };
}

async function loggedIn(cli: CliRunner): Promise<boolean> {
  const outcome = await runJson(cli, ["wallet", "status"]);
  if (!outcome.ok) {
    return false;
  }
  const status = statusSchema.safeParse(outcome.data);
  return status.success && status.data.loggedIn;
}

async function xLayerAddress(cli: CliRunner): Promise<string | null> {
  const outcome = await runJson(cli, ["wallet", "addresses", "--chain", "xlayer"]);
  if (!outcome.ok) {
    return null;
  }
  const addresses = addressesSchema.safeParse(outcome.data);
  if (!addresses.success) {
    return null;
  }
  return addresses.data.xlayer.find((entry) => entry.chainIndex === "196")?.address ?? null;
}

async function onChainBalance(chain: ChainReader, address: string): Promise<string> {
  let balance: bigint;
  try {
    balance = await chain.usdt0Balance(address);
  } catch (error) {
    throw new HttpError(
      502,
      "CHAIN_UNAVAILABLE",
      `Reading the USDT0 balance failed: ${messageOf(error)}`,
    );
  }
  if (balance > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`USDT0 balance ${String(balance)} exceeds the representable range`);
  }
  return formatMicros(Number(balance));
}

export async function walletView(cli: CliRunner, chain: ChainReader): Promise<WalletView> {
  try {
    if (!(await loggedIn(cli))) {
      return view("LOGGED_OUT", null, null);
    }
    const address = await xLayerAddress(cli);
    if (address === null) {
      return view("LOGGED_OUT", null, null);
    }
    return view("READY", address, await onChainBalance(chain, address));
  } catch (error) {
    if (error instanceof CliNotInstalled) {
      return view("NOT_INSTALLED", null, null);
    }
    throw error;
  }
}
