import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { compile, ROOT } from "./compile.mjs";
import {
  ANVIL_PRIVATE_KEY,
  ANVIL_PRIVATE_KEY_2,
  resolveNetwork,
} from "./chains.mjs";

const net = resolveNetwork();
if (net.key !== "anvil") {
  console.error("❌ test:contract chỉ chạy trên anvil (local) cho an toàn.");
  process.exit(1);
}

let passed = 0;
const failures = [];
function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`   ✅ ${name}`);
  } else {
    failures.push(name + (detail ? ` — ${detail}` : ""));
    console.log(`   ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const eq = (a, b) => (typeof a === "bigint" ? a === b : String(a) === String(b));

const src = readFileSync(join(ROOT, "src", "lib", "cats.ts"), "utf8");
const CATS = JSON.parse(src.slice(src.indexOf("[{"), src.lastIndexOf("]") + 1));

const buildTokenURI = (cat) =>
  "data:application/json;base64," +
  Buffer.from(
    JSON.stringify({
      name: `${cat.name} - Team1 VN`,
      description:
        "AvaxCats - pixel summit cat of Team Avalanche (Team1 VN). " +
        "Minted on Anvil local (31337) for the academy demo.",
      image: cat.image,
      attributes: cat.attributes,
    }),
  ).toString("base64");

const { abi, bytecode } = compile({ quiet: true });
const alice = privateKeyToAccount(ANVIL_PRIVATE_KEY);
const bob = privateKeyToAccount(ANVIL_PRIVATE_KEY_2);
const transport = http(net.rpcUrl);
const pub = createPublicClient({ chain: net.chain, transport });
const wallet = (account) =>
  createWalletClient({ account, chain: net.chain, transport });

try {
  await pub.getChainId();
} catch {
  console.error(`
❌ Không kết nối được anvil ở ${net.rpcUrl}
   Mở tab terminal khác và chạy:  npm run anvil
`);
  process.exit(1);
}

console.log(`\n🧪 AvaxCats — test trên ${net.label}\n`);

console.log("1. Deploy contract mới");
const deployHash = await wallet(alice).deployContract({ abi, bytecode });
const deployReceipt = await pub.waitForTransactionReceipt({ hash: deployHash });
const address = deployReceipt.contractAddress;
check("deploy thành công", deployReceipt.status === "success", address);

const read = (functionName, args = []) =>
  pub.readContract({ address, abi, functionName, args });

console.log("\n2. Trạng thái ban đầu");
check("name = 'AvaxCats - Team1 VN'", eq(await read("name"), "AvaxCats - Team1 VN"));
check("symbol = 'ACAT'", eq(await read("symbol"), "ACAT"));
check("COLLECTION_SIZE = 48", eq(await read("COLLECTION_SIZE"), 48n));
check("MAX_SUPPLY = 48 (mỗi con 1-of-1)", eq(await read("MAX_SUPPLY"), 48n));
check("totalMinted = 0", eq(await read("totalMinted"), 0n));
check("mintedBitmap = 0 khi chưa ai mint", eq(await read("mintedBitmap"), 0n));

console.log("\n3. Alice mint con mèo đầu tiên");
const cat0 = CATS[0];
const uri0 = buildTokenURI(cat0);
const mintHash = await wallet(alice).writeContract({
  address,
  abi,
  functionName: "mint",
  args: [0n, uri0],
});
const mintReceipt = await pub.waitForTransactionReceipt({ hash: mintHash });
check("giao dịch mint thành công", mintReceipt.status === "success");

const [minted] = parseEventLogs({
  abi,
  logs: mintReceipt.logs,
  eventName: "Minted",
});
check("có event Minted", Boolean(minted));
check("tokenId đầu tiên = 1", eq(minted?.args.tokenId, 1n));
check("event.catId = 0", eq(minted?.args.catId, 0n));
check("event.to = ví Alice", eq(minted?.args.to, alice.address));
check("catOf(1) = 0", eq(await read("catOf", [1n]), 0n));
check("catMinted(0) = true", (await read("catMinted", [0n])) === true);
check("mintedBitmap bật đúng bit 0", eq(await read("mintedBitmap"), 1n));
check("totalMinted = 1", eq(await read("totalMinted"), 1n));
check("ownerOf(1) = Alice", eq(await read("ownerOf", [1n]), alice.address));
check("balanceOf(Alice) = 1", eq(await read("balanceOf", [alice.address]), 1n));
console.log(`   ⛽ gas mint: ${mintReceipt.gasUsed} (tokenURI ${uri0.length} ký tự)`);

console.log("\n4. tokenURI đọc lại từ chain khớp 100% với dữ liệu gửi lên");
const onchainURI = await read("tokenURI", [1n]);
check("tokenURI khớp từng byte", onchainURI === uri0);
const meta = JSON.parse(
  Buffer.from(
    onchainURI.replace("data:application/json;base64,", ""),
    "base64",
  ).toString(),
);
check("metadata.name đúng", eq(meta.name, `${cat0.name} - Team1 VN`));
check("metadata.image là ảnh PNG data URI", meta.image.startsWith("data:image/png;base64,"));
check("metadata.attributes đủ 12 layer", meta.attributes.length === cat0.attributes.length);

console.log("\n5. Bob mint con thứ hai — tokenId phải tăng, không đụng của Alice");
const cat1 = CATS[1];
const mint2 = await pub.waitForTransactionReceipt({
  hash: await wallet(bob).writeContract({
    address,
    abi,
    functionName: "mint",
    args: [1n, buildTokenURI(cat1)],
  }),
});
const [minted2] = parseEventLogs({ abi, logs: mint2.logs, eventName: "Minted" });
check("tokenId thứ hai = 2", eq(minted2?.args.tokenId, 2n));
check("ownerOf(2) = Bob", eq(await read("ownerOf", [2n]), bob.address));
check("ownerOf(1) vẫn là Alice", eq(await read("ownerOf", [1n]), alice.address));
check("totalMinted = 2", eq(await read("totalMinted"), 2n));
check("mintedBitmap = 0b11", eq(await read("mintedBitmap"), 3n));

console.log("\n6. Mint LẠI một con đã có chủ → phải REVERT");
let dupReverted = false;
try {
  await wallet(bob).writeContract({
    address, abi, functionName: "mint", args: [0n, uri0],
  });
} catch (e) {
  dupReverted = /CatAlreadyMinted/.test(String(e));
}
check("mint trùng con #0 revert CatAlreadyMinted", dupReverted);
check("totalMinted vẫn = 2", eq(await read("totalMinted"), 2n));

console.log("\n7. catId ngoài bộ sưu tập → phải REVERT");
let oobReverted = false;
try {
  await wallet(bob).writeContract({
    address, abi, functionName: "mint", args: [48n, uri0],
  });
} catch (e) {
  oobReverted = /CatDoesNotExist/.test(String(e));
}
check("mint catId 48 revert CatDoesNotExist", oobReverted);

console.log("\n8. Bán hết bộ sưu tập rồi thì không mint thêm được nữa");
for (let i = 2; i < 48; i++) {
  await wallet(alice).writeContract({
    address, abi, functionName: "mint", args: [BigInt(i), buildTokenURI(CATS[i])],
  });
}
check("totalMinted = 48", eq(await read("totalMinted"), 48n));
check("mintedBitmap = đủ 48 bit", eq(await read("mintedBitmap"), (1n << 48n) - 1n));
let soldOut = false;
try {
  await wallet(bob).writeContract({
    address, abi, functionName: "mint", args: [7n, buildTokenURI(CATS[7])],
  });
} catch (e) {
  soldOut = /CatAlreadyMinted/.test(String(e));
}
check("mint thêm khi đã hết revert", soldOut);

console.log("\n9. Token chưa tồn tại phải revert");
let reverted = false;
try {
  await read("ownerOf", [999n]);
} catch {
  reverted = true;
}
check("ownerOf(999) revert", reverted);

console.log(
  `\n${failures.length === 0 ? "🎉" : "💥"} ${passed} pass, ${failures.length} fail\n`,
);
if (failures.length) {
  for (const f of failures) console.error("   ❌ " + f);
  process.exit(1);
}
