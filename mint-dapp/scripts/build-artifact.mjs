import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import solc from "solc";
import { compile, ROOT } from "./compile.mjs";

const { abi, bytecode } = compile({ quiet: true });
const source = readFileSync(join(ROOT, "contracts", "AvaxCats.sol"), "utf8");
const out = join(ROOT, "src", "lib", "artifact.ts");

const fns = abi.filter((x) => x.type === "function").length;

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
