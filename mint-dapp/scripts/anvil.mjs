import { spawn } from "node:child_process";
import { LOCAL_RPC_URL } from "./chains.mjs";

const url = new URL(LOCAL_RPC_URL);
// ❓ Port lấy từ đâu?
// → Ưu tiên ANVIL_PORT (khi 8545 bị chiếm), rồi port trong NEXT_PUBLIC_RPC_URL, mặc định 8545,
// → đúng port mặc định của anvil mà frontend và mọi script cùng trỏ tới qua chains.mjs.
const port = process.env.ANVIL_PORT || url.port || "8545";
const host = url.hostname || "127.0.0.1";

console.log(`⛓  anvil → http://${host}:${port} (chainId 31337)`);
console.log("   Keep this tab running. In another tab: npm run deploy:anvil && npm run dev\n");

// ❓ Tại sao dùng spawn thay vì gọi thẳng anvil trong package.json?
// → spawn chạy binary anvil như process con và giữ nó sống đến khi bạn Ctrl+C; stdio: "inherit" để log của anvil
// → (10 account + private key, từng block được mine) hiện thẳng ra terminal. Wrapper này còn bắt được lỗi "chưa cài" ở dưới.
const child = spawn(
  "anvil",
  // ❓ anvil khởi động thì có gì?
  // → Một chain EVM trong RAM: 10 account đã nạp sẵn 10000 (hiển thị là AVAX), private key in ra terminal, chainId 31337,
  // → và "instant mining": mỗi tx vào block ngay nên tx.wait() gần như tức thì. Tắt anvil là mất hết state → phải deploy lại.
  ["--host", host, "--port", port, "--chain-id", "31337"],
  { stdio: "inherit" },
);

child.on("error", (err) => {
  // ❓ ENOENT nghĩa là gì?
  // → "No such file": Node không tìm thấy binary `anvil` trong PATH → Foundry chưa cài. Bắt riêng để in hướng dẫn cài thay vì stack trace.
  if (err.code === "ENOENT") {
    console.error(`
❌ anvil is not installed (it's part of the Foundry toolkit).

   macOS / Linux:
     curl -L https://foundry.paradigm.xyz | bash
     foundryup

   Windows: install via WSL, or see https://getfoundry.sh
`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

// ❓ Dòng cuối để làm gì?
// → Khi anvil tắt (Ctrl+C hoặc crash), wrapper thoát với cùng exit code để npm/terminal biết kết quả.
child.on("exit", (code) => process.exit(code ?? 0));
