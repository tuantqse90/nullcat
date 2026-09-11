import { defineChain } from "viem";
import { avalancheFuji } from "wagmi/chains";

export const LOCAL_RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

// ❓ Vì sao phải tự defineChain cho anvil?
// → viem có sẵn avalancheFuji, nhưng anvil là chain local trên máy bạn (id 31337, RPC 127.0.0.1)
//   nên phải khai báo tay: chainId, token gas và URL RPC.
export const anvil = defineChain({
  id: 31337,
  name: "Anvil (local)",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: { default: { http: [LOCAL_RPC_URL] } },
  testnet: true,
});

export const CHAINS = { anvil, fuji: avalancheFuji } as const;
export type ChainKey = keyof typeof CHAINS;

// ❓ Chọn mạng bằng biến môi trường có lợi gì?
// → Cùng một code chạy anvil để học và Fuji để demo. Đổi NEXT_PUBLIC_CHAIN trong .env.local là xong,
//   không component nào hardcode tên mạng.
export const CHAIN_KEY: ChainKey =
  (process.env.NEXT_PUBLIC_CHAIN || "anvil").toLowerCase() === "fuji"
    ? "fuji"
    : "anvil";

export const activeChain = CHAINS[CHAIN_KEY];
export const isLocal = CHAIN_KEY === "anvil";

export const CHAIN_LABEL = isLocal
  ? `Anvil local (${anvil.id})`
  : `Fuji Testnet (${avalancheFuji.id})`;

// ❓ POLL_MS là gì?
// → Chu kỳ frontend hỏi lại chain (mintedBitmap, totalMinted). Anvil đào block tức thì nên hỏi mỗi 4s;
//   Fuji ~2s một block, 12s là đủ và đỡ tốn RPC công cộng.
export const POLL_MS = isLocal ? 4_000 : 12_000;

export const EXPLORER = isLocal ? "" : "https://testnet.snowtrace.io";
export const FAUCET = "https://build.avax.network/console/primary-network/faucet";

export { avalancheFuji };
