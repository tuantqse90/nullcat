import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import solc from "solc";
import { compile, ROOT } from "./compile.mjs";

// ❓ Sao file này lại compile lần nữa?
// → Tái dùng compile() ở compile.mjs để lấy abi + bytecode mới nhất từ AvaxCats.sol; quiet: true để không in log.
const { abi, bytecode } = compile({ quiet: true });
// ❓ Sao cần cả source .sol chứ không chỉ bytecode?
// → UI hiển thị source cho học viên đọc và so với Remix. Bytecode chỉ để deploy; source chỉ để người đọc.
const source = readFileSync(join(ROOT, "contracts", "AvaxCats.sol"), "utf8");
// ❓ Tại sao phải ghi bytecode ra một file .ts?
// → Frontend (Next.js) không thể chạy solc trong trình duyệt. Ta "nướng" sẵn source + bytecode vào một module TypeScript
// → để UI import như hằng số (dùng cho deploy từ trình duyệt hoặc hiển thị thông tin contract).
const out = join(ROOT, "src", "lib", "artifact.ts");

const fns = abi.filter((x) => x.type === "function").length;

// ❓ JSON.stringify(source) để làm gì, source đã là string rồi?
// → JSON.stringify biến chuỗi thành literal hợp lệ trong TS: tự escape dấu ", \n, backslash. Chèn thô thì một dấu nháy trong .sol
// → là hỏng cả artifact.ts. Phần `as \`0x\${string}\`` ép kiểu bytecode thành hex type mà viem yêu cầu (dấu \ vì đang ở trong template string).
writeFileSync(
  out,
  `export const CONTRACT_SOURCE = ${JSON.stringify(source)};

export const CONTRACT_FILE = "contracts/AvaxCats.sol";
export const SOLC_VERSION = ${JSON.stringify(solc.version().split("+")[0])};
export const BYTECODE_SIZE = ${(bytecode.length - 2) / 2};
export const FUNCTION_COUNT = ${fns};

export const AVAXCATS_BYTECODE = ${JSON.stringify(bytecode)} as \`0x\${string}\`;
`,
);

const kb = (readFileSync(out, "utf8").length / 1024).toFixed(1);
console.log(`📦 src/lib/artifact.ts — bytecode ${(bytecode.length - 2) / 2} bytes, ${fns} functions (file ${kb} KB)`);
