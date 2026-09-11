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
// ❓ Sao test chỉ được chạy trên anvil?
// → Test deploy contract mới và mint hết 48 mèo: tốn gas thật và làm bẩn dữ liệu nếu chạy trên Fuji.
// → anvil là chain riêng, miễn phí, restart là sạch.
if (net.key !== "anvil") {
  console.error("❌ test:contract only runs on anvil (local) for safety.");
  process.exit(1);
}

let passed = 0;
const failures = [];
// ❓ check() là gì, sao không dùng jest/mocha?
// → Mini test-runner tự viết để không cần thêm dependency: đếm pass, gom fail, in kết quả từng dòng.
// → Cuối file exit code 1 nếu có fail → npm script/CI biết test rớt.
function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`   ✅ ${name}`);
  } else {
    failures.push(name + (detail ? ` — ${detail}` : ""));
    console.log(`   ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
// ❓ Sao cần hàm eq thay vì ===?
// → uint256 từ chain về JS là BigInt: 1n !== 1 và 1n !== "1". eq so BigInt với BigInt,
// → còn string/address thì so qua String() để không fail chỉ vì khác kiểu.
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
// ❓ Alice và Bob là ai?
// → Account #0 và #1 mà anvil in ra lúc khởi động (private key cố định, công khai). Dùng 2 ví khác nhau
// → để test ownerOf/balanceOf đúng chủ và tokenId tăng dần giữa các ví.
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
❌ Could not connect to anvil at ${net.rpcUrl}
   Open another terminal tab and run:  npm run anvil
`);
  process.exit(1);
}

console.log(`\n🧪 AvaxCats — testing on ${net.label}\n`);

console.log("1. Deploy a fresh contract");
// ❓ Sao mỗi lần test lại deploy contract mới?
// → Để mỗi lần chạy có state sạch (totalMinted = 0, bitmap = 0). Dùng lại contract cũ thì test "mint cat 0" fail vì đã mint lần trước.
// → Trên anvil deploy là miễn phí và tức thì nên không có lý do gì để tái dùng.
const deployHash = await wallet(alice).deployContract({ abi, bytecode });
const deployReceipt = await pub.waitForTransactionReceipt({ hash: deployHash });
const address = deployReceipt.contractAddress;
check("deploy succeeded", deployReceipt.status === "success", address);

const read = (functionName, args = []) =>
  pub.readContract({ address, abi, functionName, args });

console.log("\n2. Initial state");
check("name = 'AvaxCats - Team1 VN'", eq(await read("name"), "AvaxCats - Team1 VN"));
check("symbol = 'ACAT'", eq(await read("symbol"), "ACAT"));
// ❓ Mấy hằng số 48n này từ đâu?
// → Contract khai báo COLLECTION_SIZE = MAX_SUPPLY = 48 (mỗi mèo 1-of-1). Hậu tố n vì read() trả BigInt.
// → Đổi số mèo trong .sol thì phải sửa cả test này lẫn cats.ts (set-contract sẽ bắt lệch).
check("COLLECTION_SIZE = 48", eq(await read("COLLECTION_SIZE"), 48n));
check("MAX_SUPPLY = 48 (each cat is 1-of-1)", eq(await read("MAX_SUPPLY"), 48n));
check("totalMinted = 0", eq(await read("totalMinted"), 0n));
check("mintedBitmap = 0 before any mint", eq(await read("mintedBitmap"), 0n));

console.log("\n3. Alice mints the first cat");
const cat0 = CATS[0];
const uri0 = buildTokenURI(cat0);
const mintHash = await wallet(alice).writeContract({
  address,
  abi,
  functionName: "mint",
  args: [0n, uri0],
});
const mintReceipt = await pub.waitForTransactionReceipt({ hash: mintHash });
check("mint transaction succeeded", mintReceipt.status === "success");

// ❓ parseEventLogs làm gì với receipt.logs?
// → receipt.logs là log thô (topics + data hex) của MỌI event trong tx: cả Transfer của ERC721 lẫn Minted của ta.
// → parseEventLogs dùng abi lọc đúng eventName "Minted" và decode thành args { to, tokenId, catId }.
// → Đây là cách duy nhất lấy tokenId từ một tx ghi: return value của mint() không nằm trong receipt.
const [minted] = parseEventLogs({
  abi,
  logs: mintReceipt.logs,
  eventName: "Minted",
});
check("Minted event emitted", Boolean(minted));
check("first tokenId = 1", eq(minted?.args.tokenId, 1n));
check("event.catId = 0", eq(minted?.args.catId, 0n));
check("event.to = Alice's wallet", eq(minted?.args.to, alice.address));
check("catOf(1) = 0", eq(await read("catOf", [1n]), 0n));
check("catMinted(0) = true", (await read("catMinted", [0n])) === true);
// ❓ Sao mint cat 0 thì bitmap = 1?
// → bitmap là uint256, bit thứ i = 1 nghĩa là cat i đã mint. Mint cat 0 → bit 0 bật → 0b1 = 1n.
// → Sau khi Bob mint cat 1 → 0b11 = 3n (mục 5). Mint hết 48 → (1n << 48n) - 1n (mục 8).
check("mintedBitmap has exactly bit 0 set", eq(await read("mintedBitmap"), 1n));
check("totalMinted = 1", eq(await read("totalMinted"), 1n));
check("ownerOf(1) = Alice", eq(await read("ownerOf", [1n]), alice.address));
check("balanceOf(Alice) = 1", eq(await read("balanceOf", [alice.address]), 1n));
console.log(`   ⛽ mint gas: ${mintReceipt.gasUsed} (tokenURI ${uri0.length} chars)`);

console.log("\n4. tokenURI read back from chain matches the submitted data 100%");
// ❓ Mục 4 chứng minh điều gì?
// → tokenURI đọc lại từ chain phải giống HỆT chuỗi đã gửi (byte-for-byte), rồi decode base64 → JSON để chắc name/image/attributes còn nguyên.
// → Không có IPFS: toàn bộ metadata nằm on-chain, đọc bằng eth_call.
const onchainURI = await read("tokenURI", [1n]);
check("tokenURI matches byte-for-byte", onchainURI === uri0);
const meta = JSON.parse(
  Buffer.from(
    onchainURI.replace("data:application/json;base64,", ""),
    "base64",
  ).toString(),
);
check("metadata.name is correct", eq(meta.name, `${cat0.name} - Team1 VN`));
check("metadata.image is a PNG data URI", meta.image.startsWith("data:image/png;base64,"));
check("metadata.attributes has all 12 layers", meta.attributes.length === cat0.attributes.length);

console.log("\n5. Bob mints the second cat — tokenId must increment, Alice's untouched");
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
check("second tokenId = 2", eq(minted2?.args.tokenId, 2n));
check("ownerOf(2) = Bob", eq(await read("ownerOf", [2n]), bob.address));
check("ownerOf(1) is still Alice", eq(await read("ownerOf", [1n]), alice.address));
check("totalMinted = 2", eq(await read("totalMinted"), 2n));
check("mintedBitmap = 0b11", eq(await read("mintedBitmap"), 3n));

console.log("\n6. Minting an already-owned cat AGAIN → must REVERT");
let dupReverted = false;
try {
  await wallet(bob).writeContract({
    address, abi, functionName: "mint", args: [0n, uri0],
  });
} catch (e) {
  // ❓ Làm sao biết tx revert đúng lý do?
  // → viem mô phỏng tx (eth_estimateGas) trước khi gửi; contract revert với custom error CatAlreadyMinted(catId) → viem decode tên error
  // → nhờ abi và ném exception. Test kiểm tra đúng TÊN lỗi, không chỉ "có lỗi", tránh pass nhầm vì lỗi khác (ví dụ hết gas).
  dupReverted = /CatAlreadyMinted/.test(String(e));
}
check("duplicate mint of cat #0 reverts CatAlreadyMinted", dupReverted);
check("totalMinted still = 2", eq(await read("totalMinted"), 2n));

console.log("\n7. catId outside the collection → must REVERT");
let oobReverted = false;
try {
  await wallet(bob).writeContract({
    address, abi, functionName: "mint", args: [48n, uri0],
  });
} catch (e) {
  oobReverted = /CatDoesNotExist/.test(String(e));
}
check("mint catId 48 reverts CatDoesNotExist", oobReverted);

console.log("\n8. Once the collection is sold out, no more mints allowed");
// ❓ Vòng lặp gửi 46 tx liên tiếp mà không chờ receipt, có ổn không?
// → Trên anvil instant mining, mỗi writeContract await xong là tx đã vào block, nonce tự tăng đúng.
// → Trên mạng thật cần chờ receipt/quản lý nonce cẩn thận hơn. Mục tiêu: sold-out để lần mint tiếp theo phải revert.
for (let i = 2; i < 48; i++) {
  await wallet(alice).writeContract({
    address, abi, functionName: "mint", args: [BigInt(i), buildTokenURI(CATS[i])],
  });
}
check("totalMinted = 48", eq(await read("totalMinted"), 48n));
check("mintedBitmap = all 48 bits set", eq(await read("mintedBitmap"), (1n << 48n) - 1n));
let soldOut = false;
try {
  await wallet(bob).writeContract({
    address, abi, functionName: "mint", args: [7n, buildTokenURI(CATS[7])],
  });
} catch (e) {
  soldOut = /CatAlreadyMinted/.test(String(e));
}
check("minting after sell-out reverts", soldOut);

console.log("\n9. Nonexistent token must revert");
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
// ❓ Sao phải process.exit(1)?
// → Exit code khác 0 là tín hiệu chuẩn "test fail" cho npm/CI. Không có dòng này, script luôn "thành công" dù có test rớt.
if (failures.length) {
  for (const f of failures) console.error("   ❌ " + f);
  process.exit(1);
}
