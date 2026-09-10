import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, createWalletClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { compile, ROOT } from "./compile.mjs";
import { ANVIL_PRIVATE_KEY, resolveNetwork } from "./chains.mjs";

const ENV_FILE = join(ROOT, ".env.local");
const net = resolveNetwork();

const { abi, bytecode } = compile();

const envKey = process.env.DEPLOYER_PRIVATE_KEY ?? "";
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

const account = privateKeyToAccount(pk);
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

if (chainId !== net.chain.id) {
  console.error(
    `❌ RPC ${net.rpcUrl} reports chainId ${chainId}, not ${net.chain.id}.\n` +
      "   You may be running a different anvil (forking another chain) on the same port.",
  );
  process.exit(1);
}

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
const hash = await walletClient.deployContract({ abi, bytecode });
console.log("   tx:", hash);

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
console.log("📝 Wrote NEXT_PUBLIC_CHAIN + NEXT_PUBLIC_CONTRACT_ADDRESS to .env.local");
console.log("   → restart `npm run dev` and you can mint right away!");
