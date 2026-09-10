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
  code = await client.getCode({ address });
} catch (e) {
  console.error(`❌ Could not reach RPC ${net.rpcUrl}\n   ${e.shortMessage ?? e.message}`);
  process.exit(1);
}

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
❌ The contract at this address is missing functions: ${missing.join(", ")}

   You most likely compiled an old version of the .sol file. The correct one is
   contracts/AvaxCats.sol in the mint-dapp folder — it has mint(catId, uri)
   and mintedBitmap() so each cat can only be minted once.
`);
  process.exit(1);
}

const src = readFileSync(join(ROOT, "src", "lib", "cats.ts"), "utf8");
const catCount = JSON.parse(src.slice(src.indexOf("[{"), src.lastIndexOf("]") + 1)).length;

console.log(`✅ Confirmed AvaxCats:
   name            : ${results.name} (${results.symbol})
   COLLECTION_SIZE : ${results.COLLECTION_SIZE}
   minted          : ${results.totalMinted} / ${results.MAX_SUPPLY}`);

if (Number(results.COLLECTION_SIZE) !== catCount) {
  console.error(`
❌ The contract says the collection has ${results.COLLECTION_SIZE} cats, but cats.ts has ${catCount}.
   Regenerate the cats to match:  python3 generate.py --count ${results.COLLECTION_SIZE} --seed 1337
   then:                          python3 build_mint_site.py
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
