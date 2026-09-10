import { defineChain } from "viem";
import { avalancheFuji } from "viem/chains";

export const LOCAL_RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

export const anvil = defineChain({
  id: 31337,
  name: "Anvil (local)",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: { default: { http: [LOCAL_RPC_URL] } },
  testnet: true,
});

export const ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const ANVIL_PRIVATE_KEY_2 =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

export function resolveNetwork(argv = process.argv) {
  const flag = argv.find((a) => a.startsWith("--network"));
  const fromFlag = flag?.includes("=")
    ? flag.split("=")[1]
    : flag
      ? argv[argv.indexOf(flag) + 1]
      : undefined;
  const bare = argv.slice(2).find((a) => /^(anvil|fuji)$/i.test(a));
  const raw = fromFlag || bare || process.env.NEXT_PUBLIC_CHAIN || "anvil";

  const key = raw.toLowerCase() === "fuji" ? "fuji" : "anvil";
  return key === "fuji"
    ? {
        key,
        chain: avalancheFuji,
        rpcUrl: avalancheFuji.rpcUrls.default.http[0],
        explorer: "https://testnet.snowtrace.io",
        label: "Avalanche Fuji (43113)",
      }
    : {
        key,
        chain: anvil,
        rpcUrl: LOCAL_RPC_URL,
        explorer: "",
        label: `Anvil local (31337) — ${LOCAL_RPC_URL}`,
      };
}
