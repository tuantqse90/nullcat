import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, http } from "viem";
import { ROOT } from "./compile.mjs";
import { resolveNetwork } from "./chains.mjs";

const ENV_FILE = join(ROOT, ".env.local");

const SITE_CONFIG = join(ROOT, "..", "mint-site", "config.js");
const net = resolveNetwork();
const address = process.argv.slice(2).find((a) => /^0x[0-9a-fA-F]{40}$/.test(a));

if (!address) {
  console.error(`
❌ Thiếu địa chỉ contract.

   npm run set-contract 0x....

   Địa chỉ lấy ở Remix: tab "Deploy & Run" → mục Deployed Contracts →
   bấm nút copy cạnh tên contract (KHÔNG phải địa chỉ ví của bạn).
`);
  process.exit(1);
}

const client = createPublicClient({ chain: net.chain, transport: http(net.rpcUrl) });
console.log(`🌐 Kiểm tra trên ${net.label}\n`);

let code;
try {
  code = await client.getCode({ address });
} catch (e) {
  console.error(`❌ Không gọi được RPC ${net.rpcUrl}\n   ${e.shortMessage ?? e.message}`);
  process.exit(1);
}

if (!code || code === "0x") {
  console.error(`
❌ Ở địa chỉ ${address} KHÔNG có contract nào trên ${net.chain.name}.

   Ba nguyên nhân hay gặp:
   1. Dán nhầm địa chỉ VÍ thay vì địa chỉ CONTRACT (Remix: mục Deployed
      Contracts, không phải mục ACCOUNT)
   2. Lúc bấm Deploy trong Remix, ví đang ở mạng khác — kiểm tra ví đang ở
      ${net.chain.name} (chainId ${net.chain.id}) rồi deploy lại
   3. Đang kiểm tra sai mạng — thêm cờ:  --network ${net.key === "fuji" ? "anvil" : "fuji"}
`);
  process.exit(1);
}
console.log(`✅ Có contract ở đó — bytecode ${(code.length - 2) / 2} bytes`);

const abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "COLLECTION_SIZE", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "MAX_SUPPLY", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalMinted", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "mintedBitmap", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
];

const read = (functionName) => client.readContract({ address, abi, functionName });
const results = {};
const missing = [];
for (const fn of abi.map((x) => x.name)) {
  try {
    results[fn] = await read(fn);
  } catch {
    missing.push(fn);
  }
}

if (missing.length) {
  console.error(`
❌ Contract ở địa chỉ này thiếu hàm: ${missing.join(", ")}

   Nhiều khả năng bạn đã compile nhầm bản .sol cũ. Bản đúng là file
   contracts/AvaxCats.sol trong thư mục mint-dapp — nó có mint(catId, uri)
   và mintedBitmap() để mỗi con mèo chỉ mint được một lần.
`);
  process.exit(1);
}

const src = readFileSync(join(ROOT, "src", "lib", "cats.ts"), "utf8");
const catCount = JSON.parse(src.slice(src.indexOf("[{"), src.lastIndexOf("]") + 1)).length;

console.log(`✅ Đúng là AvaxCats:
   name            : ${results.name} (${results.symbol})
   COLLECTION_SIZE : ${results.COLLECTION_SIZE}
   đã mint         : ${results.totalMinted} / ${results.MAX_SUPPLY}`);

if (Number(results.COLLECTION_SIZE) !== catCount) {
  console.error(`
❌ Contract nói bộ sưu tập có ${results.COLLECTION_SIZE} con, nhưng cats.ts có ${catCount} con.
   Sinh lại bộ mèo cho khớp:  python3 generate.py --count ${results.COLLECTION_SIZE} --seed 1337
   rồi:                       python3 build_mint_site.py
`);
  process.exit(1);
}

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

let alsoSite = "";
if (existsSync(SITE_CONFIG)) {
  const cfg = readFileSync(SITE_CONFIG, "utf8")
    .replace(/NETWORK:\s*"[^"]*"/, `NETWORK: "${net.key}"`)
    .replace(/CONTRACT_ADDRESS:\s*"[^"]*"/, `CONTRACT_ADDRESS: "${address}"`);
  writeFileSync(SITE_CONFIG, cfg);
  alsoSite = "\n📝 Đã ghi vào ../mint-site/config.js (bài 1 dùng chung contract này)";
}

console.log(`
📝 Đã ghi vào .env.local
   NEXT_PUBLIC_CHAIN=${net.key}
   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}${alsoSite}${
     net.explorer ? `\n\n🔍 ${net.explorer}/address/${address}` : ""
   }

   → restart \`npm run dev\` là mint được ngay.
`);
