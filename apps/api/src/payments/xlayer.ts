export const xLayerNetwork = "eip155:196";
export const xLayerNetworkName = "X Layer";
export const usdt0Asset = "USDT0";
export const usdt0Address = "0x779Ded0c9e1022225f8E0630b35a9b54bE713736";
export const xLayerExplorer = "https://www.oklink.com/xlayer";

export function explorerAddressUrl(address: string): string {
  return `${xLayerExplorer}/address/${address}`;
}

export function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}
