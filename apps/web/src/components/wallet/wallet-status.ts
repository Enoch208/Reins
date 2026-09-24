import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  Login01Icon,
  PlugSocketIcon,
  WifiDisconnected01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { WalletStatus, WalletView } from "@reins/core";
import type { Tone } from "@/components/status/status-chip";
import type { Resource } from "@/lib/use-resource";

export interface WalletStatusSpec {
  readonly tone: Tone;
  readonly icon: IconSvgElement;
  readonly label: string;
  readonly dot: string;
}

const statusSpecs: Record<WalletStatus, WalletStatusSpec> = {
  READY: { tone: "approved", icon: CheckmarkCircle02Icon, label: "Ready", dot: "bg-approved" },
  LOGGED_OUT: {
    tone: "unresolved",
    icon: Login01Icon,
    label: "Logged out",
    dot: "bg-unresolved",
  },
  NOT_INSTALLED: {
    tone: "released",
    icon: PlugSocketIcon,
    label: "Not installed",
    dot: "bg-released",
  },
};

const unavailableSpec: WalletStatusSpec = {
  tone: "neutral",
  icon: WifiDisconnected01Icon,
  label: "Unavailable",
  dot: "bg-faint",
};

const checkingSpec: WalletStatusSpec = {
  tone: "neutral",
  icon: Clock01Icon,
  label: "Checking",
  dot: "bg-faint",
};

export function walletStatusSpec(wallet: Resource<WalletView>): WalletStatusSpec {
  if (wallet.data) return statusSpecs[wallet.data.status];
  return wallet.error ? unavailableSpec : checkingSpec;
}

export const walletStatusExplanations: Record<WalletStatus, string> = {
  READY: "The wallet is logged in on the Reins API host and can pay for approved purchases.",
  LOGGED_OUT:
    "The Agentic Wallet is installed on the Reins API host, but no one is logged in. An operator must log in to it on that host before Reins can pay for any approved purchase.",
  NOT_INSTALLED:
    "The OKX Agentic Wallet CLI (onchainos) is not installed on the Reins API host. An operator must install it and log in there before Reins can pay for any approved purchase.",
};
