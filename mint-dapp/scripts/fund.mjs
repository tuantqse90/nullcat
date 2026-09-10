import { createPublicClient, formatEther, http, parseEther, toHex } from "viem";
import { resolveNetwork } from "./chains.mjs";

const net = resolveNetwork();
if (net.key !== "anvil") {
  console.error(`
❌ npm run fund only works on anvil.

   Real networks can't print money on demand — that's exactly the difference.
   On Fuji, get test AVAX from the faucet: https://build.avax.network/console/primary-network/faucet
`);
  process.exit(1);
}

const [address, amountArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!/^0x[0-9a-fA-F]{40}$/.test(address ?? "")) {
  console.error(`
❌ Missing wallet address.

   npm run fund 0xYourWalletAddress        # fund 10000 AVAX
   npm run fund 0xYourWalletAddress 500    # fund 500 AVAX

   Where to find it: open Core/MetaMask and copy the active wallet address — or
   check the wallet bar on the mint page after clicking "Connect wallet".
`);
  process.exit(1);
}

const amount = amountArg ?? "10000";
const client = createPublicClient({ chain: net.chain, transport: http(net.rpcUrl) });

try {
  await client.getChainId();
} catch {
  console.error(`
❌ Could not connect to anvil at ${net.rpcUrl}
   Open another terminal tab and run:  npm run anvil
`);
  process.exit(1);
}

const before = await client.getBalance({ address });

await client.request({
  method: "anvil_setBalance",
  params: [address, toHex(parseEther(amount))],
});

const after = await client.getBalance({ address });
console.log(`
💰 Funded ${address}
   before : ${formatEther(before)} AVAX
   after  : ${formatEther(after)} AVAX

   Go back to the mint page — the balance updates automatically and you can mint right away.
`);
