import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// ❓ solc là gì, sao không cần Remix/Hardhat?
// → solc chính là trình biên dịch Solidity, đóng gói thành npm package (solc-js chạy bằng WASM).
// → Có nó là compile được ngay trong Node, không cần tool nào khác.
import solc from "solc";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "contracts", "AvaxCats.sol");

// ❓ Contract có `import "@openzeppelin/..."`, solc lấy file đó ở đâu?
// → solc chỉ nhận đúng 1 source ta đưa; gặp import nó gọi callback này với path (ví dụ "@openzeppelin/contracts/token/ERC721/ERC721.sol").
// → Ta đọc file từ node_modules và trả về { contents }. Thiếu callback này → lỗi "File not found" dù đã npm install.
function findImports(path) {
  try {
    return { contents: readFileSync(join(ROOT, "node_modules", path), "utf8") };
  } catch {
    return {
      error:
        `Import not found: ${path}\n` +
        "→ Have you run `npm install` in the mint-dapp folder?",
    };
  }
}

export function compile({ quiet = false } = {}) {
  if (!quiet) {
    console.log(
      `🔨 Compile contracts/AvaxCats.sol (solc ${solc.version().split("+")[0]})…`,
    );
  }

  // ❓ Object input này có format gì?
  // → Đây là "standard JSON input", cách chính thức để nói chuyện với solc: language, sources (tên file → nội dung), settings.
  // → Remix/Hardhat/Foundry bên trong đều tạo ra đúng JSON này. optimizer runs=200 là mặc định phổ biến, giảm gas khi gọi hàm.
  const input = {
    language: "Solidity",
    sources: { "AvaxCats.sol": { content: readFileSync(SOURCE, "utf8") } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // ❓ Tại sao chỉ xin "abi" và "evm.bytecode.object"?
      // → outputSelection chọn output cho mọi file (*) và mọi contract (*). Deploy cần đúng 2 thứ: abi (để encode/decode lời gọi hàm)
      // → và bytecode (mã EVM gửi lên chain). Không xin thêm AST, sourcemap… nên compile nhanh và output gọn.
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };

  // ❓ solc.compile nhận và trả về gì?
  // → Nhận CHUỖI JSON (nên phải JSON.stringify input) và trả về chuỗi JSON → JSON.parse lại.
  // → Option { import: findImports } gắn callback resolve import ở trên.
  const out = JSON.parse(
    solc.compile(JSON.stringify(input), { import: findImports }),
  );

  // ❓ Sao phải filter severity === "error"?
  // → out.errors chứa cả warning (ví dụ biến không dùng). Chỉ dừng khi có lỗi thật, warning vẫn cho qua.
  // → Không check ở đây thì dòng dưới crash khó hiểu vì out.contracts là undefined.
  const errors = (out.errors ?? []).filter((e) => e.severity === "error");
  if (errors.length) {
    for (const e of errors) console.error(e.formattedMessage);
    process.exit(1);
  }

  // ❓ Sao phải index 2 tầng ["AvaxCats.sol"]["AvaxCats"]?
  // → Output của solc gom theo file → theo contract, vì một file .sol có thể chứa nhiều contract.
  // → Key "AvaxCats.sol" phải khớp key trong input.sources ở trên; tên contract phải khớp `contract AvaxCats` trong .sol.
  const artifact = out.contracts["AvaxCats.sol"]["AvaxCats"];
  const abi = artifact.abi;
  // ❓ Tại sao phải thêm "0x"?
  // → solc trả bytecode là chuỗi hex thô không có tiền tố. viem/ethers yêu cầu hex dạng `0x${string}`, thiếu là deployContract từ chối.
  // → Đây là toàn bộ mã máy EVM sẽ nằm trong field data của tx deploy.
  const bytecode = "0x" + artifact.evm.bytecode.object;

  if (!quiet) {
    console.log(
      `✅ Compile OK — bytecode ${(bytecode.length - 2) / 2} bytes, ` +
        `${abi.filter((x) => x.type === "function").length} public functions`,
    );
  }
  return { abi, bytecode };
}

// ❓ Dòng cuối này để làm gì?
// → File này vừa là module (deploy.mjs import compile) vừa chạy trực tiếp được (`node scripts/compile.mjs`).
// → Chỉ tự chạy khi được gọi trực tiếp, để lúc bị import không compile 2 lần.
if (process.argv[1]?.endsWith("compile.mjs")) compile();
