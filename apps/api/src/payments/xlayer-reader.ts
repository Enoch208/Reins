import {
  createPublicClient,
  erc20Abi,
  http,
  isAddress,
  isHash,
  isAddressEqual,
  parseAbi,
  parseEventLogs,
  TransactionReceiptNotFoundError,
  type Address,
  type Hex,
} from "viem";
import { xLayer } from "viem/chains";
import type { ChainReader, ReceiptLookup } from "./chain";
import { usdt0Address } from "./xlayer";

const eip3009Abi = parseAbi([
  "function authorizationState(address authorizer, bytes32 nonce) view returns (bool)",
  "event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)",
]);

const maxLogRange = 100n;

function asAddress(value: string): Address {
  if (!isAddress(value, { strict: false })) {
    throw new RangeError(`${value} is not an EVM address`);
  }
  return value;
}

function asHash(value: string): Hex {
  if (!isHash(value)) {
    throw new RangeError(`${value} is not a 32-byte hex value`);
  }
  return value;
}

export function createXLayerReader(rpcUrl: string): ChainReader {
  const client = createPublicClient({ chain: xLayer, transport: http(rpcUrl) });
  const usdt0 = asAddress(usdt0Address);

  return {
    async head() {
      const block = await client.getBlock({ blockTag: "latest" });
      return { number: block.number, timestampSeconds: block.timestamp };
    },

    async receipt(txHash): Promise<ReceiptLookup> {
      try {
        const receipt = await client.getTransactionReceipt({ hash: asHash(txHash) });
        if (receipt.status !== "success") {
          return { status: "REVERTED" };
        }
        const logs = receipt.logs.filter((log) => isAddressEqual(log.address, usdt0));
        const transfers = parseEventLogs({ abi: erc20Abi, eventName: "Transfer", logs }).map(
          (log) => ({ from: log.args.from, to: log.args.to, value: log.args.value }),
        );
        return { status: "SUCCESS", transfers };
      } catch (error) {
        if (error instanceof TransactionReceiptNotFoundError) {
          return { status: "NOT_FOUND" };
        }
        throw error;
      }
    },

    authorizationUsed(payer, nonce, atBlock) {
      return client.readContract({
        address: usdt0,
        abi: eip3009Abi,
        functionName: "authorizationState",
        args: [asAddress(payer), asHash(nonce)],
        blockNumber: atBlock,
      });
    },

    async findAuthorizationTx(payer, nonce, fromBlock, toBlock) {
      for (let start = fromBlock; start <= toBlock; start += maxLogRange) {
        const end = start + maxLogRange - 1n < toBlock ? start + maxLogRange - 1n : toBlock;
        const logs = await client.getLogs({
          address: usdt0,
          event: eip3009Abi[1],
          args: { authorizer: asAddress(payer), nonce: asHash(nonce) },
          fromBlock: start,
          toBlock: end,
        });
        const found = logs[0];
        if (found !== undefined) {
          return found.transactionHash;
        }
      }
      return null;
    },

    usdt0Balance(address) {
      return client.readContract({
        address: usdt0,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [asAddress(address)],
      });
    },
  };
}
