import { createPublicClient, formatEther, http, parseEther, toHex } from "viem";
import { resolveNetwork } from "./chains.mjs";

const net = resolveNetwork();
// ❓ Sao script này từ chối chạy trên Fuji?
// → anvil_setBalance là RPC method riêng của anvil, chỉ node local mới có. Mạng thật không có cách "in tiền":
// → muốn có AVAX test phải xin faucet. Đây chính là điểm khác biệt cốt lõi giữa local chain và mạng thật.
if (net.key !== "anvil") {
  console.error(`
❌ npm run fund only works on anvil.

   Real networks can't print money on demand — that's exactly the difference.
   On Fuji, get test AVAX from the faucet: https://build.avax.network/console/primary-network/faucet
`);
  process.exit(1);
}

const [address, amountArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!/^0x[0-9a-fA-F]{40}$/.test(address ?? "")) {
  console.error(`
❌ Missing wallet address.

   npm run fund 0xYourWalletAddress        # fund 10000 AVAX
   npm run fund 0xYourWalletAddress 500    # fund 500 AVAX

   Where to find it: open Core/MetaMask and copy the active wallet address — or
   check the wallet bar on the mint page after clicking "Connect wallet".
`);
  process.exit(1);
}

// ❓ Tại sao số tiền để dạng chuỗi "10000"?
// → parseEther bên dưới nhận string và đổi ra wei (×10^18) dạng BigInt, tránh sai số float của JS với số lớn.
const amount = amountArg ?? "10000";
const client = createPublicClient({ chain: net.chain, transport: http(net.rpcUrl) });

try {
  // ❓ Gọi getChainId chỉ để làm gì?
  // → Ping RPC xem anvil có đang chạy không. Chưa `npm run anvil` thì fail ngay với hướng dẫn, thay vì ECONNREFUSED khó hiểu ở bước sau.
  await client.getChainId();
} catch {
  console.error(`
❌ Could not connect to anvil at ${net.rpcUrl}
   Open another terminal tab and run:  npm run anvil
`);
  process.exit(1);
}

const before = await client.getBalance({ address });

// ❓ client.request với method "anvil_setBalance" là gì?
// → Gọi JSON-RPC thô: viem không có wrapper cho method riêng của anvil nên gửi trực tiếp. params = [address, số dư mới dạng hex wei].
// → Số dư được SET (không phải cộng thêm) ngay lập tức, không cần tx, không cần block, không cần ai ký.
await client.request({
  method: "anvil_setBalance",
  params: [address, toHex(parseEther(amount))],
});

// ❓ Sao đọc lại balance sau khi set?
// → Xác nhận state trên node thật sự đã đổi và in before/after cho học viên thấy. getBalance trả wei BigInt → formatEther để hiển thị.
const after = await client.getBalance({ address });
console.log(`
💰 Funded ${address}
   before : ${formatEther(before)} AVAX
   after  : ${formatEther(after)} AVAX

   Go back to the mint page — the balance updates automatically and you can mint right away.
`);
