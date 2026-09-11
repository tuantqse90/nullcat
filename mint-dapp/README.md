# AvaxCats Mint dApp — Next.js · Anvil (local) → Avalanche Fuji

A complete NFT mint dApp for the academy class of **Team Avalanche — Team1 VN** 🇻🇳.
An industry-standard 2026 stack — exactly what real web3 projects use today:

| Layer | Technology | Role |
|---|---|---|
| Frontend | **Next.js 16** (App Router) + **TypeScript** | React framework, rendering + routing |
| Styling | **Tailwind CSS v4** | Black-and-red AVAX theme via `@theme` tokens |
| Web3 | **wagmi v3** + **viem 2** | Wallet connection hooks, contract reads/writes |
| Data | **TanStack Query** | Caching + automatic refetching of on-chain data |
| Contract | **Solidity 0.8 + OpenZeppelin** (ERC-721) | Compiled with solc + deployed with viem, in one command |
| Chain (learning) | **Anvil** (31337) — foundry | Local blockchain: free, instant mints |
| Chain (demo) | **Avalanche Fuji C-Chain** (43113) | Real testnet — AVAX from the faucet |

**The same code runs on both networks** — change one line in `.env.local`.
Learn and test on anvil for speed, then switch to Fuji for the demo.

```
mint-dapp/
├── contracts/AvaxCats.sol        # ERC-721 contract
├── scripts/
│   ├── chains.mjs                # declares both networks for the terminal side
│   ├── compile.mjs               # solc: .sol → ABI + bytecode
│   ├── anvil.mjs                 # starts the local blockchain on the port the app points to
│   ├── build-artifact.mjs        # compiles .sol → src/lib/artifact.ts for the web DEPLOY button
│   ├── deploy.mjs                # deploys + writes the address to .env.local automatically
│   └── test-contract.mjs         # 24 end-to-end tests run on anvil
├── public/                       # register.html, CNAME, .nojekyll → copied straight into out/
├── .env.example                  # environment variable template
└── src/
    ├── app/
    │   ├── layout.tsx            # page shell + <Providers>
    │   ├── providers.tsx         # WagmiProvider + QueryClientProvider
    │   ├── page.tsx              # main mint page (hero + stats strip + 3 steps)
    │   └── globals.css           # Tailwind v4 + design tokens modeled on Avalanche Builder Hub
    ├── components/
    │   ├── ui.tsx                # primitives: Button (sweep), Card, Pillar, Stat, Chapter, Eyebrow…
    │   ├── Nav.tsx / Footer.tsx  # Builder Hub shell: sticky nav, 4-column footer
    │   ├── Logo.tsx              # Avalanche logo (SVG)
    │   ├── ThemeToggle.tsx       # light / dark (localStorage + prefers-color-scheme)
    │   ├── WalletBar.tsx         # stats strip: network · wallet · balance · minted + connect button
    │   ├── SupplyBadge.tsx       # reads totalMinted/MAX_SUPPLY on-chain
    │   ├── CatGrid.tsx           # grid of 48 cats
    │   ├── MintPanel.tsx         # sends the mint tx + reads the event to get the tokenId
    │   └── MyCats.tsx            # reads your NFTs BACK from the chain
    └── lib/
        ├── links.ts              # Builder Hub links (Team1 ref), docs, console, status
        ├── artifact.ts           # contract bytecode + source (auto-generated)
        ├── deployed.ts           # your contract address (localStorage)
        ├── chains.ts             # anvil + Fuji, selected via NEXT_PUBLIC_CHAIN
        ├── wagmi.ts              # chain + connector config (injected / dev wallet)
        ├── contract.ts           # address (from env) + ABI as const
        ├── metadata.ts           # build & parse tokenURI (JSON ↔ base64)
        └── cats.ts               # 48 cats (auto-generated, don't edit by hand)
```

Important lines carry a `// ❓ question` / `// → answer` comment in Vietnamese for students; the same goes for the contract, the scripts and the Python generator. The English overview lives in the **code reading path**
section below and in this README.

---

## Step 0 — Requirements

**Running locally (recommended first):**

- **Node.js 20+** — `node --version`
- **Foundry** (for the `anvil` command) — `anvil --version`.
  If you don't have it, install it:
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```
- **No wallet, no faucet, no internet needed.**

**For the Fuji demo, you also need:**

- A **Core Wallet** (<https://core.app>) or **MetaMask** wallet — a learning wallet,
  with no real funds
- Test AVAX on Fuji C-Chain: <https://build.avax.network/console/primary-network/faucet>

---

## Option 1 — Run locally with anvil (3 commands, 30 seconds)

```bash
cd mint-dapp
npm install
```

**Terminal tab 1** — start the local blockchain and leave it running:

```bash
npm run anvil
```

**Terminal tab 2** — deploy the contract, then run the web app:

```bash
npm run deploy:anvil     # compile + deploy + write .env.local automatically
npm run dev
```

Open <http://localhost:3000> → click **Dev wallet (anvil)** → pick a cat →
**Mint NFT**. Done. No wallet popup, no fees, instant confirmation.

> **Why is no wallet needed?** Anvil comes with 10 unlocked accounts and signs
> every transaction sent to it on their behalf. The "dev wallet" button simply talks
> to anvil directly via `eth_sendTransaction`. This only works on a local chain — a
> real network never signs for anyone, which is exactly why wallets exist.

You can also practice with a real wallet right on anvil: add the network manually
in MetaMask (RPC `http://127.0.0.1:8545`, chainId `31337`, symbol
`AVAX`), then click **Connect wallet** as usual.

> ⚠️ A real wallet on anvil has a balance of **0** — anvil only hands out 10000 AVAX
> to its 10 default accounts and has no idea who your wallet is. Clicking MINT will hit
> `insufficient funds for intrinsic transaction cost`. Fund that wallet with:
>
> ```bash
> npm run fund 0xYourWalletAddress
> ```
>
> The page also shows this exact command, with your wallet address filled in, whenever it sees a zero balance.
> (On Fuji there is no command that prints money — you have to go to the faucet. That
> difference is worth discussing in class.)

### Running the contract tests

```bash
npm run test:contract     # needs anvil running in the other tab
```

24 end-to-end tests: deploy → mint → read back `ownerOf`/`tokenURI` and compare
byte-for-byte with the data that was sent, check that tokenId increments correctly,
that two wallets minting don't collide, and that a non-existent token reverts. The
tests deploy their own contract, so they never touch the one you're using.

### ⚠️ Stopping anvil wipes everything

Anvil keeps its state in RAM. Close that tab → the contract disappears → the page says
"cannot read contract". Start `npm run anvil` again, then rerun
`npm run deploy:anvil`, and you're back.

### Port 8545 already taken?

Add this to `.env.local` (both anvil and the app read this line, so there's only one
place to change):

```
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8546
```

---

## Minting on a phone (Core mobile / MetaMask mobile)

On a phone, Safari/Chrome **have no injected wallet** — Core mobile and MetaMask
mobile connect to dApps via **WalletConnect**. The page already has this button; it
just needs a (free) Project ID:

1. Go to <https://dashboard.reown.com> → create a project (type *AppKit / WalletConnect*),
   and add the domain `team1vn.xyz` (plus `localhost` for dev) to *Allowed domains*.
2. Paste the Project ID into `.env.local`:
   ```
   NEXT_PUBLIC_WC_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Rebuild (`npm run build`) and deploy. On a phone you'll see a
   **Core / MetaMask** button → pick a wallet → the wallet app opens to approve the connection and sign transactions.
   On desktop, this button shows a QR code to scan with Core mobile (Portfolio tab → Scan).

Without a Project ID you can still mint by opening the page **inside the Core app**:
Core → **Browser** tab → paste the link `https://team1vn.xyz` (the status bar on the
page has a *Copy link* button). MetaMask mobile has a similar "Open in MetaMask"
link.

---

## Option 2 — Deploy to Avalanche Fuji (a demo with proof on Snowtrace)

Minting on Fuji is a real transaction: it has a tx hash, shows up on
[Snowtrace](https://testnet.snowtrace.io), and the NFT appears in your wallet. This is
the one you can take to a demo.

**Prerequisites:** a Core/MetaMask wallet (a separate testnet wallet!) + test AVAX from
<https://build.avax.network/console/primary-network/faucet> (select the **Fuji C-Chain** network).

```bash
# .env.local
NEXT_PUBLIC_CHAIN=fuji
NEXT_PUBLIC_CONTRACT_ADDRESS=      # leave empty — everyone deploys their own on the web
```

```bash
npm run dev
```

Go to <http://localhost:3000> → **Connect wallet** → the **Step 1** screen shows the full
`.sol` contract → click **🚀 Deploy contract** → sign in your wallet → you now have your
own contract; click **Go to mint** and mint.

**No Remix, no private key, no files to edit.** Students only need a
browser + a wallet + a little test AVAX.

> **How much does it cost?** Fuji's base fee is currently ~10 wei, so it's nearly free. Even
> at the historical 25 nAVAX rate: deploying ~0.03 AVAX, each mint ~0.035 AVAX
> (the ~1.8KB tokenURI lives fully on-chain, so it costs ~1.4M gas). One faucet visit is
> more than enough.

### Moving between the two steps

After deploying, a **01 Contract · 02 Pick & mint · 03 Register** bar appears at the top of the page — switch
back and forth freely. Going back to step 1 still shows the full `.sol` code along with the
contract address in use (with a Snowtrace link), and two options: **Go to mint** to
return, or **Forget this contract** if you want to deploy a new one. The footer also has a
**View contract** link.

### Where your contract is stored

The address lives in the browser's `localStorage` (key
`avaxcats:contract:<chainId>`), so it survives a refresh. To start over, click
**Deploy another contract** in the footer.

The bytecode is precompiled at build time (`npm run artifact` → `src/lib/artifact.ts`,
5.7KB), so clicking DEPLOY sends it immediately — no need to download the 9MB solc.

<details>
<summary><b>Alternative — the whole class shares one contract</b></summary>

The instructor deploys once and the whole class shares it; each cat can only be claimed
by one person — once all 48 are gone, they're gone, and watching the grid gray out is very satisfying.

```bash
npm run set-contract 0xSharedContractAddress
```

This command verifies the address (does it have bytecode, is it really AvaxCats, does it
have exactly 48 cats) before writing it to `.env.local` and `../mint-site/config.js`. Anyone who
already deployed their own contract can click **Deploy another contract** in the footer to return
to the shared one.
</details>

<details>
<summary><b>Alternative — deploy with Remix or the CLI</b></summary>

**Remix:** open <https://remix.ethereum.org>, copy
[`contracts/AvaxCats.sol`](contracts/AvaxCats.sol), Compile with `0.8.20`+,
Environment **Injected Provider** (wallet on Fuji), **Deploy** → copy the address under
*Deployed Contracts* → `npm run set-contract 0x...`.

**CLI:** put `DEPLOYER_PRIVATE_KEY=0x...` (a throwaway testnet wallet!) in `.env.local`,
then `npm run deploy:fuji`. Fast, but it means keeping a private key in a text file.
</details>

## Collecting KPIs (Step 3 — registration form)

After minting, students click **03 Register** and fill in:

| Field | Source |
|---|---|
| Gmail (registered on Builder Hub) | typed manually — **required** |
| Name | typed manually — **required** |
| Telegram | typed manually — `@handle`, `t.me/handle` or a bare handle all work; the app normalizes to `@handle` |
| X (Twitter) | typed manually — `@handle` or an x.com link; **at least one of Telegram / X is required** |
| Deployed contract | **auto-filled** from Step 1 |
| Wallet | **auto-filled** from the connected wallet |
| NFTs minted | **auto-read** from `balanceOf` on-chain |

The data flows straight into a Google Sheet. Set it up in 2 minutes:

1. Create a new Google Sheet → menu **Extensions → Apps Script**
2. Delete the sample code and paste in the contents of [`docs/kpi-apps-script.gs`](docs/kpi-apps-script.gs)
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** ← required, otherwise students' browsers get blocked
4. Copy the URL `https://script.google.com/macros/s/…/exec` → paste it into `.env.local`:
   ```
   NEXT_PUBLIC_KPI_ENDPOINT=https://script.google.com/macros/s/…/exec
   ```
5. Restart `npm run dev`

The Sheet creates a **KPI** tab with all 10 columns on the first submission.

> **One thing you must know:** Apps Script answers a POST with a chain of redirects
> (302 → `script.googleusercontent.com` → …). If the browser follows that whole
> chain, the signed-in Google account can make the last hop return 404 even though the
> row was written to the Sheet. The app sends with `redirect: "manual"`: receiving the first 302
> (`opaqueredirect`) means the script ran → it reports "sent". No 302 (wrong URL
> pasted) falls through to `no-cors` and says plainly "could not confirm — check the
> Sheet". Don't change this to report "success" unconditionally.

If the endpoint isn't configured, the form still appears with a yellow warning, and the submit
button reports a clear error instead of failing silently.

## Command reference

| Command | What it does |
|---|---|
| `npm run anvil` | Starts the local blockchain (port taken from `.env.local`) |
| `npm run compile` | Compiles the contract only, to check syntax |
| `npm run deploy:anvil` | Deploys to anvil (uses built-in account #0, no key needed) |
| `npm run deploy:fuji` | Deploys to Fuji (needs `DEPLOYER_PRIVATE_KEY`) |
| `npm run fund 0x...` | Funds your wallet with fake AVAX on anvil (local only) |
| `npm run set-contract 0x...` | Points the app at an already-deployed contract — verifies it before writing `.env.local` |
| `npm run artifact` | Recompiles the contract into `src/lib/artifact.ts` (runs automatically before `dev`/`build`) |
| `npm run deploy` | Deploys to the network set in `NEXT_PUBLIC_CHAIN` |
| `npm run test:contract` | 24 end-to-end tests on anvil |
| `npm run dev` | Runs the web app at <http://localhost:3000> |
| `npm run local` | Combined: `deploy:anvil`, then `dev` |
| `npm run build` | Production build + TypeScript check |

## Variables in `.env.local`

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_CHAIN` | `anvil` (default) or `fuji` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Contract address — written automatically by the deploy script |
| `NEXT_PUBLIC_RPC_URL` | Anvil's RPC, only needed when changing the port |
| `DEPLOYER_PRIVATE_KEY` | Only required when deploying to Fuji |

After editing `.env.local`, remember to **restart `npm run dev`**.

---

## How the dApp works (code reading path)

1. **`lib/chains.ts`** — declares both networks and picks one via an environment variable.
   That way no component hardcodes "Fuji".
2. **`lib/wagmi.ts`** — `createConfig` is the single source of truth for every hook:
   which chain, which connector, which RPC. The `mock()` connector (dev wallet) is only
   added when running on anvil.
3. **`app/providers.tsx`** — `WagmiProvider` + `QueryClientProvider` wrap the
   app; every wagmi hook below reads its config from here.
4. **`components/WalletBar.tsx`** — `useConnect` requests wallet access,
   `useAccount` tracks the address/chainId, `useSwitchChain` asks the wallet to switch
   to the right network, `useBalance` reads the balance.
5. **`components/SupplyBadge.tsx`** — `useReadContract` calls a view function
   over RPC (no wallet needed!), `refetchInterval` keeps it updated as the whole class mints.
6. **`lib/metadata.ts`** — builds a standard ERC-721 tokenURI:
   `data:application/json;base64,...` — the image is embedded, no IPFS needed.
7. **`components/MintPanel.tsx`** — `useWriteContract` sends the tx →
   `useWaitForTransactionReceipt` waits for confirmation → `parseEventLogs` (viem)
   pulls the `Minted` event out to get the `tokenId`.
8. **`components/MyCats.tsx`** — the reverse direction: `useReadContracts` calls
   `ownerOf` + `tokenURI` for the N most recent tokens, decodes the base64 and renders them.
   The images shown here come FROM the blockchain, not from `cats.ts`.

## Discussion questions for the class

- Why can `SupplyBadge` read data BEFORE a wallet is connected?
  (hint: reads over RPC ≠ writes that need a signature)
- Anvil can sign transactions on your behalf, but Fuji can't. What does that tell us
  about what a wallet actually does for us?
- Embedding the image in the tokenURI vs. using IPFS — pros and cons? Minting one cat costs
  ~1.39 million gas (see the `npm run test:contract` output); how much money
  is that on mainnet?
- How does `_safeMint` differ from `_mint`? What happens if `to` is a contract
  that can't receive ERC-721 tokens?
- What if two students mint the same cat? (different tokenIds — an NFT is a
  token, not the picture — see test 6)
- Exercise: modify the contract to limit each wallet to one mint; add a 0.01 AVAX
  mint fee (`payable`); write tests for the new rules.

## Common issues

| Symptom | Cause / fix |
|---|---|
| "not deployed — run npm run deploy:anvil" | Not deployed yet, or `.env.local` was edited without restarting `npm run dev` |
| "cannot read contract — is anvil still running?" | Anvil was stopped/restarted (state lost) → start it again, then `npm run deploy:anvil` |
| `deploy:anvil` says "Cannot connect to anvil" | `npm run anvil` isn't running in another tab |
| `deploy:anvil` says "chainId 143, not 31337" | Port 8545 is taken by another anvil/node → set `NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8546` |
| `deploy:fuji` says the key is missing | Put `DEPLOYER_PRIVATE_KEY=0x...` (a separate testnet wallet) in `.env.local` |
| "Wrong network" | Click the SWITCH TO… button; the wallet adds the network if it doesn't have it yet |
| Mint fails with "insufficient funds" **on anvil** | You clicked Connect wallet with Core/MetaMask — anvil only funds its own 10 accounts, so your wallet has a balance of 0. Use the **Dev wallet (anvil)** button, or `npm run fund <wallet address>` |
| Mint fails with "insufficient funds" **on Fuji** | The wallet is out of test AVAX — go back to the faucet |
| Buttons do nothing, console shows 403 | You're opening it via an unfamiliar IP — use `localhost:3000`, or add the host to `allowedDevOrigins` in `next.config.ts` |
| Blank page after build | Run `npm run build` to see the TypeScript errors |

## Plain HTML version

A minimal, framework-free version (one `index.html` file + ethers.js from a CDN) lives in
`../mint-site/` — it also runs on both anvil and Fuji, and is meant for the first session to
understand the fundamentals before moving up to Next.js + wagmi.

## Regenerating the cat set

```bash
# from the nullcat/ root directory
python3 generate.py --count 48 --seed 1337
python3 build_mint_site.py     # writes both mint-site/cats.js and mint-dapp/src/lib/cats.ts
```
