import { createConfig, http } from "wagmi";
import { injected, mock, walletConnect } from "wagmi/connectors";
import { anvil, avalancheFuji, isLocal, LOCAL_RPC_URL } from "./chains";

export const ANVIL_ACCOUNT =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const;

export const WC_PROJECT_ID = (process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "").trim();
export const hasWalletConnect = WC_PROJECT_ID.length > 0;

const SITE_URL =
  typeof window !== "undefined" ? window.location.origin : "https://team1vn.xyz";

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
  ...(isLocal
    ? [mock({ accounts: [ANVIL_ACCOUNT], features: { reconnect: true } })]
    : []),
];

export const config = createConfig({
  chains: [anvil, avalancheFuji],
  connectors,
  transports: {
    [anvil.id]: http(LOCAL_RPC_URL),
    [avalancheFuji.id]: http(),
  },
  ssr: true, // Next.js renders on the server first → avoids hydration mismatches
});

export { activeChain, anvil, avalancheFuji, isLocal } from "./chains";
