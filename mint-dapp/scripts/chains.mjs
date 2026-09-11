import { defineChain } from "viem";
import { avalancheFuji } from "viem/chains";

// ❓ RPC URL là gì và sao lại lấy từ env?
// → RPC là endpoint HTTP nhận JSON-RPC (eth_call, eth_sendRawTransaction…) của node. anvil mặc định lắng nghe ở 127.0.0.1:8545;
// → NEXT_PUBLIC_RPC_URL cho phép đổi port khi 8545 bận. Khai báo một chỗ, dùng chung cho anvil.mjs, deploy và frontend.
export const LOCAL_RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

// ❓ defineChain để làm gì, viem có sẵn Fuji mà?
// → viem có avalancheFuji sẵn nhưng không biết chain local của ta. defineChain tạo object chain (id 31337, currency, rpc)
// → để client ký tx với đúng chainId (EIP-155) và hiển thị đúng đơn vị AVAX.
export const anvil = defineChain({
  id: 31337,
  name: "Anvil (local)",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: { default: { http: [LOCAL_RPC_URL] } },
  testnet: true,
});

// ❓ Để private key ngay trong code có sao không?
// → Đây là key account #0 mà anvil in ra mỗi lần khởi động: cố định và CÔNG KHAI toàn thế giới, chỉ có giá trị trên chain local.
// → Tuyệt đối không gửi tài sản thật vào địa chỉ này. Key thật luôn nằm trong .env.local (không commit).
export const ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const ANVIL_PRIVATE_KEY_2 =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

// ❓ Thứ tự ưu tiên chọn mạng là gì?
// → --network=fuji / --network fuji > tham số trần "fuji"/"anvil" > biến NEXT_PUBLIC_CHAIN > mặc định anvil.
// → Mọi script dùng chung hàm này nên `npm run deploy -- fuji` và `npm run set-contract 0x… --network fuji` hoạt động giống nhau.
export function resolveNetwork(argv = process.argv) {
  const flag = argv.find((a) => a.startsWith("--network"));
  const fromFlag = flag?.includes("=")
    ? flag.split("=")[1]
    : flag
      ? argv[argv.indexOf(flag) + 1]
      : undefined;
  const bare = argv.slice(2).find((a) => /^(anvil|fuji)$/i.test(a));
  const raw = fromFlag || bare || process.env.NEXT_PUBLIC_CHAIN || "anvil";

  // ❓ Sao chỉ có 2 lựa chọn?
  // → Whitelist: giá trị lạ (ví dụ "mainnet") rơi về anvil, không bao giờ vô tình deploy lên mạng có tiền thật.
  // → Trả về cả chain object, rpcUrl và explorer để script không phải tự ghép.
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
