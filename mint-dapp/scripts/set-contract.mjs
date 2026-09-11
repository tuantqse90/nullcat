import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, http } from "viem";
import { ROOT } from "./compile.mjs";
import { resolveNetwork } from "./chains.mjs";

const ENV_FILE = join(ROOT, ".env.local");

// ❓ Sao script trong mint-dapp lại đụng tới mint-site?
// → Bài 1 (mint-site tĩnh) và bài 2 (mint-dapp Next.js) dùng chung một contract. Ghi địa chỉ vào cả 2 nơi để không phải sửa tay 2 lần.
const SITE_CONFIG = join(ROOT, "..", "mint-site", "config.js");
const net = resolveNetwork();
// ❓ Regex này kiểm tra gì?
// → Địa chỉ EVM = "0x" + 40 ký tự hex (20 bytes). Lấy tham số đầu tiên khớp dạng đó, nên gõ thêm --network cũng không rối.
// → Private key có 64 hex nên không khớp: nếu lỡ dán key thay vì address, script sẽ báo thiếu address thay vì ghi key ra file.
const address = process.argv.slice(2).find((a) => /^0x[0-9a-fA-F]{40}$/.test(a));

if (!address) {
  console.error(`
❌ Missing contract address.

   npm run set-contract 0x....

   Get the address from Remix: "Deploy & Run" tab → Deployed Contracts section →
   click the copy button next to the contract name (NOT your wallet address).
`);
  process.exit(1);
}

const client = createPublicClient({ chain: net.chain, transport: http(net.rpcUrl) });
console.log(`🌐 Checking on ${net.label}\n`);

let code;
try {
  // ❓ getCode dùng để làm gì?
  // → eth_getCode trả về bytecode đang nằm tại địa chỉ đó trên chain. Địa chỉ ví thường (EOA) không có code → trả "0x".
  // → Đây là cách rẻ nhất (1 eth_call, không gas) để phân biệt địa chỉ contract với địa chỉ ví, lỗi phổ biến nhất khi copy từ Remix.
  code = await client.getCode({ address });
} catch (e) {
  console.error(`❌ Could not reach RPC ${net.rpcUrl}\n   ${e.shortMessage ?? e.message}`);
  process.exit(1);
}

// ❓ Sao "0x" lại nghĩa là không có contract?
// → "0x" = chuỗi hex rỗng = 0 byte code. Ba nguyên nhân hay gặp được in bên dưới: dán nhầm địa chỉ ví,
// → deploy lên mạng khác với mạng đang check, hoặc quên cờ --network.
if (!code || code === "0x") {
  console.error(`
❌ There is NO contract at ${address} on ${net.chain.name}.

   Three common causes:
   1. You pasted your WALLET address instead of the CONTRACT address (Remix: the
      Deployed Contracts section, not the ACCOUNT field)
   2. Your wallet was on a different network when you clicked Deploy in Remix —
      make sure it is on ${net.chain.name} (chainId ${net.chain.id}) and deploy again
   3. You are checking the wrong network — add the flag:  --network ${net.key === "fuji" ? "anvil" : "fuji"}
`);
  process.exit(1);
}
console.log(`✅ Contract found — bytecode ${(code.length - 2) / 2} bytes`);

// ❓ ABI ở đây là JSON, khác với dạng chữ ở mint-site?
// → viem dùng ABI dạng JSON (đúng format solc xuất ra). Chỉ khai báo 6 hàm view cần đọc,
// → đủ để "sờ" contract xem có đúng AvaxCats không mà không cần full ABI.
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
// ❓ Gọi từng hàm view để làm gì?
// → readContract dùng eth_call (miễn phí, không tốn gas). Nếu đây là ERC721 cũ hoặc contract khác, hàm như mintedBitmap không tồn tại
// → nên call revert → ghi vào missing. Đây là cách xác minh "đúng version contract" mà không cần source.
for (const fn of abi.map((x) => x.name)) {
  try {
    results[fn] = await read(fn);
  } catch {
    missing.push(fn);
  }
}

if (missing.length) {
  console.error(`
❌ The contract at this address is missing functions: ${missing.join(", ")}

   You most likely compiled an old version of the .sol file. The correct one is
   contracts/AvaxCats.sol in the mint-dapp folder — it has mint(catId, uri)
   and mintedBitmap() so each cat can only be minted once.
`);
  process.exit(1);
}

const src = readFileSync(join(ROOT, "src", "lib", "cats.ts"), "utf8");
// ❓ Sao lại đọc cats.ts bằng string slice thay vì import?
// → cats.ts là TypeScript, Node không import trực tiếp được. Cắt đúng mảng JSON [{...}] trong file rồi parse, đủ để đếm số mèo.
const catCount = JSON.parse(src.slice(src.indexOf("[{"), src.lastIndexOf("]") + 1)).length;

console.log(`✅ Confirmed AvaxCats:
   name            : ${results.name} (${results.symbol})
   COLLECTION_SIZE : ${results.COLLECTION_SIZE}
   minted          : ${results.totalMinted} / ${results.MAX_SUPPLY}`);

// ❓ Tại sao COLLECTION_SIZE phải khớp số mèo trong cats.ts?
// → Contract chỉ cho mint catId < COLLECTION_SIZE. UI có 48 mèo mà contract chỉ cho 32 → mint cat 40 revert CatDoesNotExist;
// → ngược lại thì có cat không bao giờ hiện. results.* là BigInt nên phải Number() trước khi so với số thường.
if (Number(results.COLLECTION_SIZE) !== catCount) {
  console.error(`
❌ The contract says the collection has ${results.COLLECTION_SIZE} cats, but cats.ts has ${catCount}.
   Regenerate the cats to match:  python3 generate.py --count ${results.COLLECTION_SIZE} --seed 1337
   then:                          python3 build_mint_site.py
`);
  process.exit(1);
}

let env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
// ❓ upsert là gì?
// → Update-or-insert: thay dòng KEY=... nếu đã có trong .env.local, chưa có thì thêm cuối. Không đụng các biến khác (DEPLOYER_PRIVATE_KEY…).
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
  // ❓ Ghi vào config.js bằng regex có an toàn không?
  // → config.js chỉ có 2 field NETWORK và CONTRACT_ADDRESS nên replace bằng regex là đủ, phần còn lại của file giữ nguyên.
  // → mint-site đọc window.AVAXCATS_CONFIG từ file này lúc load trang.
  const cfg = readFileSync(SITE_CONFIG, "utf8")
    .replace(/NETWORK:\s*"[^"]*"/, `NETWORK: "${net.key}"`)
    .replace(/CONTRACT_ADDRESS:\s*"[^"]*"/, `CONTRACT_ADDRESS: "${address}"`);
  writeFileSync(SITE_CONFIG, cfg);
  alsoSite = "\n📝 Also written to ../mint-site/config.js (lesson 1 shares this contract)";
}

console.log(`
📝 Written to .env.local
   NEXT_PUBLIC_CHAIN=${net.key}
   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}${alsoSite}${
     net.explorer ? `\n\n🔍 ${net.explorer}/address/${address}` : ""
   }

   → restart \`npm run dev\` and you can mint right away.
`);
