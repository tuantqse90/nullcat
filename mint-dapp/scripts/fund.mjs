import { createPublicClient, formatEther, http, parseEther, toHex } from "viem";
import { resolveNetwork } from "./chains.mjs";

const net = resolveNetwork();
if (net.key !== "anvil") {
  console.error(`
❌ npm run fund chỉ chạy được trên anvil.

   Mạng thật không in tiền theo yêu cầu được — đó chính là điểm khác nhau.
   Trên Fuji thì xin AVAX test ở faucet: https://build.avax.network/console/primary-network/faucet
`);
  process.exit(1);
}

const [address, amountArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!/^0x[0-9a-fA-F]{40}$/.test(address ?? "")) {
  console.error(`
❌ Thiếu địa chỉ ví.

   npm run fund 0xĐịaChỉVíCủaBạn        # nạp 10000 AVAX
   npm run fund 0xĐịaChỉVíCủaBạn 500    # nạp 500 AVAX

   Địa chỉ lấy ở đâu: mở Core/MetaMask, copy địa chỉ ví đang dùng — hoặc xem
   trên thanh ví của trang mint sau khi bấm KẾT NỐI VÍ.
`);
  process.exit(1);
}

const amount = amountArg ?? "10000";
const client = createPublicClient({ chain: net.chain, transport: http(net.rpcUrl) });

try {
  await client.getChainId();
} catch {
  console.error(`
❌ Không kết nối được anvil ở ${net.rpcUrl}
   Mở tab terminal khác và chạy:  npm run anvil
`);
  process.exit(1);
}

const before = await client.getBalance({ address });

await client.request({
  method: "anvil_setBalance",
  params: [address, toHex(parseEther(amount))],
});

const after = await client.getBalance({ address });
console.log(`
💰 Đã nạp cho ${address}
   trước : ${formatEther(before)} AVAX
   sau   : ${formatEther(after)} AVAX

   Quay lại trang mint, số dư tự cập nhật — mint được ngay.
`);
