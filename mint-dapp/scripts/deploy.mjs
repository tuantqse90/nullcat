import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, createWalletClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { compile, ROOT } from "./compile.mjs";
import { ANVIL_PRIVATE_KEY, resolveNetwork } from "./chains.mjs";

const ENV_FILE = join(ROOT, ".env.local");
// ❓ Script biết deploy lên anvil hay Fuji bằng cách nào?
// → resolveNetwork() (chains.mjs) đọc cờ --network, tham số "fuji"/"anvil", hoặc NEXT_PUBLIC_CHAIN trong env; mặc định anvil.
// → Trả về { key, chain, rpcUrl, explorer, label } để cả script dùng chung.
const net = resolveNetwork();

// ❓ Tại sao deploy lại compile ngay tại đây?
// → Đảm bảo bytecode luôn khớp AvaxCats.sol hiện tại, không deploy nhầm build cũ. abi + bytecode cũng là 2 thứ duy nhất cần để deploy.
const { abi, bytecode } = compile();

const envKey = process.env.DEPLOYER_PRIVATE_KEY ?? "";
// ❓ Private key deploy lấy từ đâu, và sao anvil không cần cấu hình gì?
// → Ưu tiên DEPLOYER_PRIVATE_KEY trong .env.local (phải đúng 0x + 64 hex). Không có mà đang ở anvil → dùng key account #0
// → mà anvil in ra khi khởi động (công khai, chỉ có giá trị local). Trên Fuji bắt buộc có key riêng, không thì dừng ở dưới.
const pk =
  /^0x[0-9a-fA-F]{64}$/.test(envKey)
    ? envKey
    : net.key === "anvil"
      ? ANVIL_PRIVATE_KEY
      : "";

if (!pk) {
  console.error(`
❌ Missing or invalid DEPLOYER_PRIVATE_KEY in .env.local (required when deploying to Fuji)

   1. Create a SEPARATE TESTNET wallet in Core/MetaMask (don't use your real wallet!)
   2. Get test AVAX: https://build.avax.network/console/primary-network/faucet
   3. Export that wallet's private key (Core: Settings → Show private key)
   4. Add to .env.local:  DEPLOYER_PRIVATE_KEY=0x...

   💡 Want a quick try without a wallet? Run locally: npm run anvil + npm run deploy:anvil
`);
  process.exit(1);
}

// ❓ privateKeyToAccount làm gì?
// → Từ private key suy ra public key → address (secp256k1 + keccak256) và tạo object account biết ký tx ngay trong Node.
// → Không cần wallet extension: đây là "local account", key nằm trong process nên chỉ dùng cho testnet/local.
const account = privateKeyToAccount(pk);
// ❓ viem tách publicClient và walletClient để làm gì?
// → publicClient chỉ ĐỌC qua RPC (getChainId, getBalance, chờ receipt), không cần key. walletClient GỬI tx, cần account để ký.
// → Tách rõ để nhìn code là biết chỗ nào cần chữ ký. Cả hai dùng chung transport http(rpcUrl).
const publicClient = createPublicClient({
  chain: net.chain,
  transport: http(net.rpcUrl),
});
const walletClient = createWalletClient({
  account,
  chain: net.chain,
  transport: http(net.rpcUrl),
});

console.log(`🌐 Network: ${net.label}`);

let chainId;
try {
  // ❓ Sao phải hỏi chainId trong khi đã biết mạng?
  // → Đây là request đầu tiên tới RPC: fail thì biết ngay anvil chưa chạy hoặc mất mạng, và in hướng dẫn thay vì lỗi ECONNREFUSED khó hiểu.
  chainId = await publicClient.getChainId();
} catch {
  if (net.key === "anvil") {
    console.error(`
❌ Could not connect to anvil at ${net.rpcUrl}

   Open another terminal tab and run:   npm run anvil
   (port 8545 already in use? use:      ANVIL_PORT=8546 npm run anvil
    then add NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8546 to .env.local)
`);
  } else {
    console.error(`❌ Could not connect to RPC ${net.rpcUrl} — check your internet connection.`);
  }
  process.exit(1);
}

// ❓ chainId RPC trả về có thể khác cái ta cấu hình sao?
// → Có, nếu port 8545 đang chạy một anvil khác (ví dụ fork mainnet). Tx ký với chainId 31337 sẽ bị node từ chối (EIP-155).
// → Fail sớm ở đây với thông báo rõ ràng còn hơn lỗi mơ hồ lúc deploy.
if (chainId !== net.chain.id) {
  console.error(
    `❌ RPC ${net.rpcUrl} reports chainId ${chainId}, not ${net.chain.id}.\n` +
      "   You may be running a different anvil (forking another chain) on the same port.",
  );
  process.exit(1);
}

// ❓ Tại sao check balance trước khi deploy?
// → Deploy tốn gas trả bằng AVAX của deployer. Balance = 0 thì RPC chỉ trả "insufficient funds" khó đọc;
// → check trước để chỉ đúng chỗ lấy tiền (faucet cho Fuji, restart anvil cho local). Kết quả là BigInt wei → formatEther để in.
const balance = await publicClient.getBalance({ address: account.address });
console.log(`👛 Deployer: ${account.address} — ${formatEther(balance)} AVAX`);
if (balance === 0n) {
  console.error(
    net.key === "anvil"
      ? "❌ The anvil account has no funds?! Try restarting anvil."
      : "❌ Wallet has no test AVAX. Get some at: https://build.avax.network/console/primary-network/faucet",
  );
  process.exit(1);
}

console.log(`🚀 Deploying to ${net.chain.name} (${net.chain.id})…`);
// ❓ Deploy contract thực chất là gì?
// → Là một tx đặc biệt: `to` rỗng, `data` = bytecode (+ constructor args encode theo abi, ở đây không có).
// → walletClient ký bằng account rồi gửi eth_sendRawTransaction. Trả về ngay tx hash: contract CHƯA có trên chain lúc này.
const hash = await walletClient.deployContract({ abi, bytecode });
console.log("   tx:", hash);

// ❓ Địa chỉ contract nằm ở đâu?
// → Phải chờ tx được mine; receipt mới có status ("success"/"reverted"), gasUsed và contractAddress.
// → Địa chỉ được tính từ (address deployer, nonce) nên node điền sẵn vào receipt, ta không tự chọn được.
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success") {
  console.error("❌ Deploy failed — receipt status:", receipt.status);
  process.exit(1);
}
const address = receipt.contractAddress;
console.log(`
✅ DEPLOY SUCCESSFUL
   contract : ${address}
   gas used : ${receipt.gasUsed}${
     net.explorer ? `\n   explorer : ${net.explorer}/address/${address}` : ""
   }
`);

let env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
// ❓ Tại sao không ghi đè cả file .env.local?
// → .env.local có thể đang chứa DEPLOYER_PRIVATE_KEY của học viên. upsert dùng regex với cờ m (multiline) để thay đúng dòng KEY=...
// → nếu đã có, chưa có thì append. Các dòng khác giữ nguyên.
const upsert = (key, value) => {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  env = re.test(env)
    ? env.replace(re, line)
    : env + (env === "" || env.endsWith("\n") ? "" : "\n") + line + "\n";
};
upsert("NEXT_PUBLIC_CHAIN", net.key);
upsert("NEXT_PUBLIC_CONTRACT_ADDRESS", address);
// ❓ Ghi vào .env.local để làm gì?
// → Next.js đọc biến NEXT_PUBLIC_* lúc khởi động và nhúng vào frontend, nhờ đó UI biết địa chỉ contract + mạng mà không copy-paste tay.
// → Phải restart `npm run dev` vì env chỉ được đọc 1 lần lúc start.
writeFileSync(ENV_FILE, env);
console.log("📝 Wrote NEXT_PUBLIC_CHAIN + NEXT_PUBLIC_CONTRACT_ADDRESS to .env.local");
console.log("   → restart `npm run dev` and you can mint right away!");
