# AvaxCats — pixel NFT generator (nullcat workflow)

Generative 32x32 pixel NFT collection for **Team Avalanche — Team1 VN** —
summit cats bleeding AVAX red (#E84142), wearing The Avalanche Hood,
riding candles down the mountain. **Pure Python stdlib — no dependencies
at all** (PNGs are encoded by hand with zlib).

## Structure

| File | Role |
|---|---|
| `engine.py` | Pixel engine: 32x32 grids, drawing ops, layer compositing, PNG writer, contact sheets |
| `traits.py` | Trait library: 139 traits across 18 layers — 6 layer *dáng* (body, head, ears, mane, whiskers, belly) + màu lông, hoa văn, mắt, mồm, mũ, kính, áo, đồ cầm tay, khuyên, đuôi, hiệu ứng |
| `generate.py` | CLI: weighted rarity rolls, rendering, image + metadata output |
| `build_preview.py` | Builds the preview page (`output/preview.html`) + renders the 4 curated LEGENDS |
| `build_mint_site.py` | Embeds the generated batch into both mint frontends (`mint-site/cats.js` + `mint-dapp/src/lib/cats.ts`) |
| `mint-site/config.js` | "env" của bài 1 — dán địa chỉ contract vào đây (`npm run set-contract` ghi hộ) |
| `mint-site/` | Lesson 1 — minimal mint page: single HTML file + ethers.js CDN (`mint-site/README.md`) |
| `mint-dapp/contracts/AvaxCats.sol` | **Contract duy nhất** của cả project — cả 2 bài cùng deploy/dùng file này |
| `mint-dapp/` | Lesson 2 — production-style dApp: Next.js 16 + TypeScript + Tailwind v4 + wagmi v3 + viem (`mint-dapp/README.md`) |

Cả hai frontend chạy được **2 mạng bằng cùng một code**:

| Mạng | Khi nào dùng | Cần gì |
|---|---|---|
| **Anvil** (31337) — blockchain local | Học, test, sửa contract liên tục | Foundry. Không ví, không faucet, không internet |
| **Avalanche Fuji** (43113) — testnet thật | Demo cho lớp / cho Avalanche | Ví Core/MetaMask + AVAX từ faucet |

Mặc định là **anvil** — chạy thử local trước, lên Fuji sau.

**Sinh viên không phải cài gì ngoài ví:** mở web lên là thấy nguyên contract
`.sol`, bấm DEPLOY là contract lên chain bằng ví của chính mình, xong mới vào
được màn hình mint. Không Remix, không private key, không sửa file.

## Cài đặt — cần gì để chạy project này

Project chia 3 phần, mỗi phần yêu cầu khác nhau. Kiểm tra nhanh máy đã có gì:

```bash
python3 --version   # cần 3.10+  (generator + serve trang tĩnh)
node --version      # cần 20+    (chỉ cho mint-dapp)
anvil --version     # foundry    (chỉ khi muốn chạy blockchain local)
```

### 1. Generator + preview (`generate.py`, `build_preview.py`)

Chỉ cần **Python 3.10+** — dùng thuần stdlib, **không phải `pip install` bất kỳ
thư viện nào** (PNG được encode tay bằng zlib có sẵn).

- macOS / Linux: có sẵn `python3`
- Windows: tải tại <https://python.org> (nhớ tick "Add to PATH")

### 2. Mint site bản HTML thuần (`mint-site/`) — bài 1

Không cần cài gì thêm: ethers.js tải qua CDN, serve trang bằng chính
Python (`python3 -m http.server 8000 -d mint-site`).

- Chạy trên **anvil**: cần Foundry, KHÔNG cần ví — trang có nút
  "DÙNG VÍ DEV (ANVIL)", anvil ký hộ giao dịch.
- Chạy trên **Fuji**: cần ví **Core Wallet** (<https://core.app>) hoặc
  MetaMask + AVAX test.

### 3. Mint dApp Next.js (`mint-dapp/`) — bài 2

Cần **Node.js 20+** (khuyến nghị bản LTS):

- macOS: `brew install node` hoặc dùng nvm: <https://github.com/nvm-sh/nvm>
- Windows: tải tại <https://nodejs.org>

Sau đó mọi thư viện (Next.js 16, wagmi v3, viem 2, TanStack Query,
Tailwind v4, solc, OpenZeppelin) đã khai báo sẵn trong `package.json` —
một lệnh là xong:

```bash
cd mint-dapp
npm install
```

Chạy local đủ 3 lệnh, không cần ví lẫn faucet:

```bash
npm run anvil          # tab 1: blockchain local
npm run deploy:anvil   # tab 2: compile + deploy + ghi .env.local
npm run dev            #        mở http://localhost:3000
npm run test:contract  # (tuỳ chọn) test end-to-end trên anvil
npm run fund 0x...     # (tuỳ chọn) nạp AVAX giả nếu dùng ví thật trên anvil
```

Khi demo trên Fuji thì thêm ví Core/MetaMask (ví testnet riêng!) + AVAX
test từ faucet <https://build.avax.network/console/primary-network/faucet>, rồi
`npm run deploy:fuji`. Chi tiết xem `mint-dapp/README.md`.

### 4. Foundry (`anvil`) — blockchain local cho cả 2 bài

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Anvil dựng một EVM ngay trên máy: 10 tài khoản có sẵn 10000 AVAX giả,
block đào tức thì khi có giao dịch, và **tự ký hộ** giao dịch của các
tài khoản đó — nên mint được mà không cần cài ví. Tắt anvil là mất sạch
state, bật lại phải deploy contract lại.

### Tuỳ chọn

- **ffmpeg** — chỉ cần nếu muốn render clip từ batch ảnh
  (`brew install ffmpeg`), ví dụ: mỗi ảnh 0.3s →
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

**Dáng** (đây là thứ làm mỗi con khác nhau từ xa, không chỉ khác màu):
Body (6: Sitting · Chonk · Slim · Loaf · Standing · Wisp) · Head (5) ·
Ears (6: Pointy · Round · Folded · Big · Tufted · Notched) · Mane (5, có
Lion Mane) · Whiskers (5) · Belly (5)

**Màu & phụ kiện:** Background (13) · Fur (11) · Pattern (6) · Eyes (10) ·
Mouth (8) · Headwear (14) · Eyewear (7) · Outfit (9) · Paw Item (13) ·
Earring (4) · Tail (5) · Effect (7)

Hình học phần ĐẦU (mắt y9..11, mõm x12..19 y12..15) cố định tuyệt đối, nên
mọi trait mắt/mồm/kính/mũ/khuyên luôn khớp dù thân và tai đổi kiểu gì.
Ngược lại bụng + hoa văn + áo được **clip theo silhouette của thân**
(`generate.py`), nên thêm một dáng thân mới không phải sửa lại 9 cái áo.

Avalanche house specials: **The Avalanche Hood** (summit parka hood in
full AVAX red), **AVAX Red Card**, **Ice Axe**, **Snowflake**,
**Avalanche Red** fur (#E84142), **Snowfall Red** background, the
**Subnet Matrix** background, and the **Snowstorm** effect. Plus 4
curated **1/1 LEGENDS** defined in `build_preview.py` (The Snowfather,
Sir Stonks, Moon Mission, Blizzard Bandit) — mỗi con có dáng riêng.

Five rarity tiers: common / uncommon / rare / epic / legendary
(weights 100/55/28/12/5). Fit-coherence rules: special eyes refuse glasses
on top; a VR headset resets eyes to Normal; mũ trùm đầu (The Avalanche Hood)
bỏ bờm vì hai thứ vẽ đè lên nhau. Every trait combo is unique —
the generator rerolls on collision.

## Adding a trait

Write one draw function in `traits.py` (it receives `ctx` with the
`bg`/`cat`/`fg` layers), then register it in the matching list with
`_n("Name", "tier", draw_fn)`. Done.
