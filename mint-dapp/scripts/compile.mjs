import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "contracts", "AvaxCats.sol");

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

  const input = {
    language: "Solidity",
    sources: { "AvaxCats.sol": { content: readFileSync(SOURCE, "utf8") } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };

  const out = JSON.parse(
    solc.compile(JSON.stringify(input), { import: findImports }),
  );

  const errors = (out.errors ?? []).filter((e) => e.severity === "error");
  if (errors.length) {
    for (const e of errors) console.error(e.formattedMessage);
    process.exit(1);
  }

  const artifact = out.contracts["AvaxCats.sol"]["AvaxCats"];
  const abi = artifact.abi;
  const bytecode = "0x" + artifact.evm.bytecode.object;

  if (!quiet) {
    console.log(
      `✅ Compile OK — bytecode ${(bytecode.length - 2) / 2} bytes, ` +
        `${abi.filter((x) => x.type === "function").length} public functions`,
    );
  }
  return { abi, bytecode };
}

if (process.argv[1]?.endsWith("compile.mjs")) compile();
