# AvaxCats — pixel NFT generator (nullcat workflow)

Generative 32x32 pixel NFT collection for **Team Avalanche — Team1 VN** —
summit cats bleeding AVAX red (#E84142), wearing The Avalanche Hood,
riding candles down the mountain. **Pure Python stdlib — no dependencies
at all** (PNGs are encoded by hand with zlib).

## Structure

| File | Role |
|---|---|
| `engine.py` | Pixel engine: 32x32 grids, drawing ops, layer compositing, PNG writer, contact sheets |
| `traits.py` | Trait library: 139 traits across 18 layers — 6 *body-shape* layers (body, head, ears, mane, whiskers, belly) + fur colour, pattern, eyes, mouth, headwear, eyewear, outfit, paw item, earring, tail, effect |
| `generate.py` | CLI: weighted rarity rolls, rendering, image + metadata output |
| `build_preview.py` | Builds the preview page (`output/preview.html`) + renders the 4 curated LEGENDS |
| `build_mint_site.py` | Embeds the generated batch into both mint frontends (`mint-site/cats.js` + `mint-dapp/src/lib/cats.ts`) |
| `mint-site/config.js` | Lesson 1's "env" — paste the contract address here (`npm run set-contract` writes it for you) |
| `mint-site/` | Lesson 1 — minimal mint page: single HTML file + ethers.js CDN (`mint-site/README.md`) |
| `mint-dapp/contracts/AvaxCats.sol` | **The only contract** in the whole project — both lessons deploy/use this file |
| `mint-dapp/` | Lesson 2 — production-style dApp: Next.js 16 + TypeScript + Tailwind v4 + wagmi v3 + viem (`mint-dapp/README.md`) |

Both frontends run on **2 networks with the same code**:

| Network | When to use | Requirements |
|---|---|---|
| **Anvil** (31337) — local blockchain | Learning, testing, iterating on the contract | Foundry. No wallet, no faucet, no internet |
| **Avalanche Fuji** (43113) — real testnet | Demo for the class / for Avalanche | Core/MetaMask wallet + AVAX from the faucet |

The default is **anvil** — try it locally first, then move to Fuji.

**Students install nothing but a wallet:** open the web page and the full
`.sol` contract is right there; click DEPLOY and the contract goes on-chain
through their own wallet, and only then does the mint screen open. No Remix,
no private keys, no file editing.

## Setup — what you need to run this project

The project has 3 parts, each with different requirements. Quick check of
what your machine already has:

```bash
python3 --version   # needs 3.10+  (generator + static page server)
node --version      # needs 20+    (mint-dapp only)
anvil --version     # foundry    (only if you want a local blockchain)
```

### 1. Generator + preview (`generate.py`, `build_preview.py`)

Only needs **Python 3.10+** — pure stdlib, **no `pip install` of any
library** (PNGs are hand-encoded with the built-in zlib).

- macOS / Linux: `python3` is preinstalled
- Windows: download from <https://python.org> (remember to tick "Add to PATH")

### 2. Plain-HTML mint site (`mint-site/`) — lesson 1

Nothing extra to install: ethers.js loads from a CDN, and the page is served
by Python itself (`python3 -m http.server 8000 -d mint-site`).

- On **anvil**: needs Foundry, NO wallet needed — the page has a
  "Dev wallet (anvil)" button and anvil signs transactions for you.
- On **Fuji**: needs **Core Wallet** (<https://core.app>) or
  MetaMask + test AVAX.

### 3. Next.js mint dApp (`mint-dapp/`) — lesson 2

Needs **Node.js 20+** (LTS recommended):

- macOS: `brew install node` or use nvm: <https://github.com/nvm-sh/nvm>
- Windows: download from <https://nodejs.org>

After that, every library (Next.js 16, wagmi v3, viem 2, TanStack Query,
Tailwind v4, solc, OpenZeppelin) is already declared in `package.json` —
one command does it:

```bash
cd mint-dapp
npm install
```

Running locally takes 3 commands, no wallet or faucet needed:

```bash
npm run anvil          # tab 1: local blockchain
npm run deploy:anvil   # tab 2: compile + deploy + write .env.local
npm run dev            #        open http://localhost:3000
npm run test:contract  # (optional) end-to-end test on anvil
npm run fund 0x...     # (optional) top up fake AVAX if using a real wallet on anvil
```

For a Fuji demo, add a Core/MetaMask wallet (a separate testnet wallet!) + test
AVAX from the faucet <https://build.avax.network/console/primary-network/faucet>, then
`npm run deploy:fuji`. See `mint-dapp/README.md` for details.

### 4. Foundry (`anvil`) — local blockchain for both lessons

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Anvil spins up an EVM right on your machine: 10 accounts preloaded with 10000
fake AVAX, blocks mined instantly on each transaction, and it **auto-signs**
transactions from those accounts — so you can mint without installing a
wallet. Stopping anvil wipes all state; restart it and you must redeploy the
contract.

### Optional

- **ffmpeg** — only needed to render a clip from the image batch
  (`brew install ffmpeg`), e.g. 0.3s per image →
  `ffmpeg -framerate 10/3 -i output/images/%04d.png -c:v libx264 -pix_fmt yuv420p -r 30 output/drop.mp4`

## Run

```bash
# generate the official drop, fixed seed = fully reproducible
python3 generate.py --count 1000 --seed 42 --out drop

# quick visual review via contact sheet
python3 generate.py --count 48 --sheet

# render every trait individually (art review)
python3 generate.py --catalog

# rebuild the preview page
python3 build_preview.py
```

Per-token output:
- `output/images/0001.png` — 512x512 image (scale 16, adjust with `--scale`)
- `output/thumbs/0001.png` — native 32x32 image
- `output/metadata/0001.json` — OpenSea-style metadata (name, attributes, rarity)
- `output/collection.json` — collection-wide trait counts

## Trait system (18 layers — 139 traits)

**Body shape** (this is what makes each cat look different from afar, not just the colour):
Body (6: Sitting · Chonk · Slim · Loaf · Standing · Wisp) · Head (5) ·
Ears (6: Pointy · Round · Folded · Big · Tufted · Notched) · Mane (5, including
Lion Mane) · Whiskers (5) · Belly (5)

**Colours & accessories:** Background (13) · Fur (11) · Pattern (6) · Eyes (10) ·
Mouth (8) · Headwear (14) · Eyewear (7) · Outfit (9) · Paw Item (13) ·
Earring (4) · Tail (5) · Effect (7)

The HEAD geometry (eyes y9..11, muzzle x12..19 y12..15) is absolutely fixed, so
every eyes/mouth/eyewear/headwear/earring trait always fits no matter how the body and ears change.
Conversely, belly + pattern + outfit are **clipped to the body silhouette**
(`generate.py`), so adding a new body shape doesn't mean redrawing all 9 outfits.

Avalanche house specials: **The Avalanche Hood** (summit parka hood in
full AVAX red), **AVAX Red Card**, **Ice Axe**, **Snowflake**,
**Avalanche Red** fur (#E84142), **Snowfall Red** background, the
**Subnet Matrix** background, and the **Snowstorm** effect. Plus 4
curated **1/1 LEGENDS** defined in `build_preview.py` (The Snowfather,
Sir Stonks, Moon Mission, Blizzard Bandit) — each with its own body shape.

Five rarity tiers: common / uncommon / rare / epic / legendary
(weights 100/55/28/12/5). Fit-coherence rules: special eyes refuse glasses
on top; a VR headset resets eyes to Normal; hooded headwear (The Avalanche Hood)
drops the mane since the two would draw over each other. Every trait combo is unique —
the generator rerolls on collision.

## Adding a trait

Write one draw function in `traits.py` (it receives `ctx` with the
`bg`/`cat`/`fg` layers), then register it in the matching list with
`_n("Name", "tier", draw_fn)`. Done.
