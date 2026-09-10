import { spawn } from "node:child_process";
import { LOCAL_RPC_URL } from "./chains.mjs";

const url = new URL(LOCAL_RPC_URL);
const port = process.env.ANVIL_PORT || url.port || "8545";
const host = url.hostname || "127.0.0.1";

console.log(`⛓  anvil → http://${host}:${port} (chainId 31337)`);
console.log("   Để nguyên tab này chạy. Tab khác: npm run deploy:anvil && npm run dev\n");

const child = spawn(
  "anvil",
  ["--host", host, "--port", port, "--chain-id", "31337"],
  { stdio: "inherit" },
);

child.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error(`
❌ Chưa cài anvil (thuộc bộ Foundry).

   macOS / Linux:
     curl -L https://foundry.paradigm.xyz | bash
     foundryup

   Windows: cài qua WSL, hoặc xem https://getfoundry.sh
`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

child.on("exit", (code) => process.exit(code ?? 0));
