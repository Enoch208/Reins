export const supportedNetworks = ["eip155:196", "eip155:1952"] as const;

export type SupportedNetwork = (typeof supportedNetworks)[number];

export interface StablecoinAsset {
  readonly symbol: "USDT0";
  readonly address: string;
  readonly decimals: number;
  readonly eip712Name: string;
  readonly eip712Version: string;
}

export const usdt0ByNetwork: Record<SupportedNetwork, StablecoinAsset> = {
  "eip155:196": {
    symbol: "USDT0",
    address: "0x779ded0c9e1022225f8e0630b35a9b54be713736",
    decimals: 6,
    eip712Name: "USD₮0",
    eip712Version: "1",
  },
  "eip155:1952": {
    symbol: "USDT0",
    address: "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c",
    decimals: 6,
    eip712Name: "USD₮0",
    eip712Version: "1",
  },
};
