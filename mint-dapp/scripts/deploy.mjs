import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, createWalletClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { compile, ROOT } from "./compile.mjs";
import { ANVIL_PRIVATE_KEY, resolveNetwork } from "./chains.mjs";

const ENV_FILE = join(ROOT, ".env.local");
const net = resolveNetwork();

const { abi, bytecode } = compile();

const envKey = process.env.DEPLOYER_PRIVATE_KEY ?? "";
const pk =
  /^0x[0-9a-fA-F]{64}$/.test(envKey)
    ? envKey
    : net.key === "anvil"
      ? ANVIL_PRIVATE_KEY
      : "";

if (!pk) {
  console.error(`
❌ Thiếu hoặc sai DEPLOYER_PRIVATE_KEY trong .env.local (bắt buộc khi deploy Fuji)

   1. Tạo 1 ví TESTNET RIÊNG trong Core/MetaMask (đừng dùng ví thật!)
   2. Xin AVAX test: https://build.avax.network/console/primary-network/faucet
   3. Export private key của ví đó (Core: Settings → Show private key)
   4. Thêm vào .env.local:  DEPLOYER_PRIVATE_KEY=0x...

   💡 Muốn thử nhanh mà không cần ví? Chạy local: npm run anvil + npm run deploy:anvil
`);
  process.exit(1);
}

const account = privateKeyToAccount(pk);
const publicClient = createPublicClient({
  chain: net.chain,
  transport: http(net.rpcUrl),
});
const walletClient = createWalletClient({
  account,
  chain: net.chain,
  transport: http(net.rpcUrl),
});

console.log(`🌐 Mạng: ${net.label}`);

let chainId;
try {
  chainId = await publicClient.getChainId();
} catch {
  if (net.key === "anvil") {
    console.error(`
❌ Không kết nối được anvil ở ${net.rpcUrl}

   Mở một tab terminal khác và chạy:   npm run anvil
   (cổng 8545 đang bị chiếm? dùng:     ANVIL_PORT=8546 npm run anvil
    rồi thêm NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8546 vào .env.local)
`);
  } else {
    console.error(`❌ Không kết nối được RPC ${net.rpcUrl} — kiểm tra mạng internet.`);
  }
  process.exit(1);
}

if (chainId !== net.chain.id) {
  console.error(
    `❌ RPC ${net.rpcUrl} đang là chainId ${chainId}, không phải ${net.chain.id}.\n` +
      "   Có thể bạn đang chạy một anvil khác (fork chain khác) trên cùng cổng.",
  );
  process.exit(1);
}

const balance = await publicClient.getBalance({ address: account.address });
console.log(`👛 Deployer: ${account.address} — ${formatEther(balance)} AVAX`);
if (balance === 0n) {
  console.error(
    net.key === "anvil"
      ? "❌ Tài khoản anvil không có tiền?! Thử restart anvil."
      : "❌ Ví chưa có AVAX test. Xin tại: https://build.avax.network/console/primary-network/faucet",
  );
  process.exit(1);
}

console.log(`🚀 Đang deploy lên ${net.chain.name} (${net.chain.id})…`);
const hash = await walletClient.deployContract({ abi, bytecode });
console.log("   tx:", hash);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success") {
  console.error("❌ Deploy thất bại — receipt status:", receipt.status);
  process.exit(1);
}
const address = receipt.contractAddress;
console.log(`
✅ DEPLOY THÀNH CÔNG
   contract : ${address}
   gas used : ${receipt.gasUsed}${
     net.explorer ? `\n   explorer : ${net.explorer}/address/${address}` : ""
   }
`);

let env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
const upsert = (key, value) => {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  env = re.test(env)
    ? env.replace(re, line)
    : env + (env === "" || env.endsWith("\n") ? "" : "\n") + line + "\n";
};
upsert("NEXT_PUBLIC_CHAIN", net.key);
upsert("NEXT_PUBLIC_CONTRACT_ADDRESS", address);
writeFileSync(ENV_FILE, env);
console.log("📝 Đã ghi NEXT_PUBLIC_CHAIN + NEXT_PUBLIC_CONTRACT_ADDRESS vào .env.local");
console.log("   → restart `npm run dev` là mint được ngay!");
