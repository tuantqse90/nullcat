import { createConfig, http } from "wagmi";
import { injected, mock, walletConnect } from "wagmi/connectors";
import { anvil, avalancheFuji, isLocal, LOCAL_RPC_URL } from "./chains";

export const ANVIL_ACCOUNT =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const;

export const WC_PROJECT_ID = (process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "").trim();
export const hasWalletConnect = WC_PROJECT_ID.length > 0;

const SITE_URL =
  typeof window !== "undefined" ? window.location.origin : "https://team1vn.xyz";

// ❓ Connector là gì?
// → Cách app nói chuyện với ví. injected = ví cài trong trình duyệt (Core, MetaMask);
//   walletConnect = ví trên điện thoại (Core mobile); mock = "ví dev" chỉ dùng với anvil.
const connectors = [
  injected(),
  ...(hasWalletConnect
    ? [
        walletConnect({
          projectId: WC_PROJECT_ID,
          showQrModal: true,
          metadata: {
            name: "AvaxCats Mint — Team1 VN",
            description: "Mint an AvaxCat NFT on Avalanche Fuji — Team Avalanche · Team1 VN",
            url: SITE_URL,
            icons: [`${SITE_URL}/favicon.ico`],
          },
        }),
      ]
    : []),
  // ❓ Vì sao mock chỉ được thêm khi isLocal?
  // → Anvil tự ký hộ mọi giao dịch của 10 tài khoản mặc định (eth_sendTransaction không cần ví).
  //   Mạng thật không bao giờ ký hộ ai, nên trên Fuji connector này vô nghĩa và bị bỏ.
  ...(isLocal
    ? [mock({ accounts: [ANVIL_ACCOUNT], features: { reconnect: true } })]
    : []),
];

// ❓ createConfig là "một nguồn sự thật" nghĩa là sao?
// → Mọi hook wagmi (useAccount, useReadContract, useWriteContract...) đều lấy danh sách chain,
//   connector và transport từ object này. Đổi ở đây là cả app đổi theo.
export const config = createConfig({
  chains: [anvil, avalancheFuji],
  connectors,
  // ❓ transports làm gì?
  // → Với mỗi chain, chỉ cách gửi JSON-RPC: anvil qua URL local, Fuji qua RPC mặc định của viem.
  //   Đọc dữ liệu (view) đi qua transport; ký giao dịch đi qua connector (ví).
  transports: {
    [anvil.id]: http(LOCAL_RPC_URL),
    [avalancheFuji.id]: http(),
  },
  ssr: true, // Next.js renders on the server first → avoids hydration mismatches
});

export { activeChain, anvil, avalancheFuji, isLocal } from "./chains";
