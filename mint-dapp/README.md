# AvaxCats Mint dApp — Next.js · Anvil (local) → Avalanche Fuji

dApp mint NFT hoàn chỉnh cho lớp academy của **Team Avalanche — Team1 VN** 🇻🇳.
Stack chuẩn ngành 2026, đúng những gì các dự án web3 thật đang dùng:

| Lớp | Công nghệ | Vai trò |
|---|---|---|
| Frontend | **Next.js 16** (App Router) + **TypeScript** | Framework React, render + routing |
| Styling | **Tailwind CSS v4** | Theme AVAX đen–đỏ qua `@theme` token |
| Web3 | **wagmi v3** + **viem 2** | Hook kết nối ví, đọc/ghi contract |
| Data | **TanStack Query** | Cache + tự refetch dữ liệu on-chain |
| Contract | **Solidity 0.8 + OpenZeppelin** (ERC-721) | Compile solc + deploy viem, 1 lệnh |
| Chain (học) | **Anvil** (31337) — foundry | Blockchain local: mint miễn phí, tức thì |
| Chain (demo) | **Avalanche Fuji C-Chain** (43113) | Testnet thật — AVAX xin từ faucet |

**Cùng một code chạy được cả 2 mạng** — đổi 1 dòng trong `.env.local`.
Học và test trên anvil cho nhanh, khi demo thì bật sang Fuji.

```
mint-dapp/
├── contracts/AvaxCats.sol        # contract ERC-721
├── scripts/
│   ├── chains.mjs                # khai báo 2 mạng cho phía terminal
│   ├── compile.mjs               # solc: .sol → ABI + bytecode
│   ├── anvil.mjs                 # bật blockchain local đúng cổng app đang trỏ
│   ├── build-artifact.mjs        # compile .sol → src/lib/artifact.ts cho nút DEPLOY trên web
│   ├── deploy.mjs                # deploy + tự ghi địa chỉ vào .env.local
│   └── test-contract.mjs         # 24 test end-to-end chạy trên anvil
├── public/                       # register.html, CNAME, .nojekyll → đi thẳng vào out/
├── .env.example                  # mẫu biến môi trường
└── src/
    ├── app/
    │   ├── layout.tsx            # khung trang + <Providers>
    │   ├── providers.tsx         # WagmiProvider + QueryClientProvider
    │   ├── page.tsx              # trang mint chính (hero + stats strip + 3 bước)
    │   └── globals.css           # Tailwind v4 + design tokens theo Avalanche Builder Hub
    ├── components/
    │   ├── ui.tsx                # primitives: Button (sweep), Card, Pillar, Stat, Chapter, Eyebrow…
    │   ├── Nav.tsx / Footer.tsx  # khung Builder Hub: nav sticky, footer 4 cột
    │   ├── Logo.tsx              # logo Avalanche (SVG)
    │   ├── ThemeToggle.tsx       # light / dark (localStorage + prefers-color-scheme)
    │   ├── WalletBar.tsx         # stats strip: mạng · ví · số dư · đã mint + nút kết nối
    │   ├── SupplyBadge.tsx       # đọc totalMinted/MAX_SUPPLY on-chain
    │   ├── CatGrid.tsx           # lưới 48 con mèo
    │   ├── MintPanel.tsx         # gửi tx mint + đọc event lấy tokenId
    │   └── MyCats.tsx            # đọc NGƯỢC NFT của bạn từ chain về
    └── lib/
        ├── links.ts              # link Builder Hub (ref Team1), docs, console, status
        ├── artifact.ts           # bytecode + source contract (sinh tự động)
        ├── deployed.ts           # địa chỉ contract của bạn (localStorage)
        ├── chains.ts             # anvil + Fuji, chọn bằng NEXT_PUBLIC_CHAIN
        ├── wagmi.ts              # config chain + connector (injected / ví dev)
        ├── contract.ts           # địa chỉ (từ env) + ABI as const
        ├── metadata.ts           # build & parse tokenURI (JSON ↔ base64)
        └── cats.ts               # 48 con mèo (auto-generate, đừng sửa tay)
```

Code để trần, không comment. Phần giải thích nằm ở mục **lộ trình đọc code**
bên dưới và trong README này.

---

## Bước 0 — Yêu cầu

**Chạy local (khuyến nghị làm trước):**

- **Node.js 20+** — `node --version`
- **Foundry** (để có lệnh `anvil`) — `anvil --version`.
  Chưa có thì cài:
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```
- **Không cần ví, không cần faucet, không cần internet.**

**Khi demo trên Fuji, cần thêm:**

- Ví **Core Wallet** (<https://core.app>) hoặc **MetaMask** — ví học tập,
  không chứa tiền thật
- AVAX test trên Fuji C-Chain: <https://build.avax.network/console/primary-network/faucet>

---

## Cách 1 — Chạy local với anvil (3 lệnh, 30 giây)

```bash
cd mint-dapp
npm install
```

**Tab terminal 1** — bật blockchain local, để nguyên đó:

```bash
npm run anvil
```

**Tab terminal 2** — deploy contract rồi chạy web:

```bash
npm run deploy:anvil     # compile + deploy + tự ghi .env.local
npm run dev
```

Mở <http://localhost:3000> → bấm **DÙNG VÍ DEV (ANVIL)** → chọn mèo →
**MINT NFT**. Xong. Không popup ví, không mất phí, xác nhận tức thì.

> **Vì sao không cần cài ví?** Anvil mở sẵn 10 tài khoản và tự ký hộ mọi
> giao dịch gửi tới nó. Nút "ví dev" chỉ nói chuyện thẳng với anvil bằng
> `eth_sendTransaction`. Cách này chỉ hoạt động với chain local — mạng
> thật không bao giờ ký hộ ai cả, đó chính là lý do phải có ví.

Muốn tập dùng ví thật ngay trên anvil cũng được: thêm mạng thủ công
trong MetaMask (RPC `http://127.0.0.1:8545`, chainId `31337`, ký hiệu
`AVAX`) rồi bấm **KẾT NỐI VÍ** như bình thường.

> ⚠️ Ví thật trên anvil có số dư **0** — anvil chỉ phát 10000 AVAX cho 10 tài
> khoản mặc định của nó, không biết ví bạn là ai. Bấm MINT sẽ dính
> `insufficient funds for intrinsic transaction cost`. Nạp cho ví đó bằng:
>
> ```bash
> npm run fund 0xĐịaChỉVíCủaBạn
> ```
>
> Trang cũng tự hiện đúng lệnh này kèm địa chỉ ví khi thấy số dư bằng 0.
> (Trên Fuji thì không có lệnh nào in tiền được — phải đi xin faucet. Đó chính
> là điểm khác nhau đáng để lớp thảo luận.)

### Chạy test contract

```bash
npm run test:contract     # cần anvil đang chạy ở tab kia
```

24 test end-to-end: deploy → mint → đọc lại `ownerOf`/`tokenURI` và so
khớp từng byte với dữ liệu đã gửi lên, kiểm tra tokenId tăng đúng, 2 ví
mint không đụng nhau, token chưa tồn tại phải revert. Test tự deploy
contract riêng nên không đụng vào contract bạn đang dùng.

### ⚠️ Tắt anvil là mất sạch

Anvil giữ state trong RAM. Đóng tab đó → contract biến mất → trang báo
"không đọc được contract". Bật lại `npm run anvil` rồi chạy lại
`npm run deploy:anvil` là xong.

### Cổng 8545 đã bị chiếm?

Thêm vào `.env.local` (cả anvil lẫn app đều đọc dòng này nên chỉ cần sửa
1 chỗ):

```
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8546
```

---

## Mint trên điện thoại (Core mobile / MetaMask mobile)

Trên điện thoại, Safari/Chrome **không có ví inject** — Core mobile và MetaMask
mobile kết nối dApp qua **WalletConnect**. Trang đã có sẵn nút này, chỉ cần
một Project ID (miễn phí):

1. Vào <https://dashboard.reown.com> → tạo project (loại *AppKit / WalletConnect*),
   thêm domain `team1vn.xyz` (và `localhost` khi dev) vào *Allowed domains*.
2. Dán Project ID vào `.env.local`:
   ```
   NEXT_PUBLIC_WC_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Build lại (`npm run build`) và deploy. Trên điện thoại sẽ có nút
   **Core / MetaMask** → chọn ví → app ví tự mở để duyệt kết nối và ký giao dịch.
   Trên máy tính nút này hiện QR để quét bằng Core mobile (tab Portfolio → Scan).

Không có Project ID thì vẫn mint được bằng cách mở trang **bên trong app Core**:
Core → tab **Browser** → dán link `https://team1vn.xyz` (thanh trạng thái trên
trang có nút *Sao chép link*). MetaMask mobile có link "Mở trong MetaMask"
tương tự.

---

## Cách 2 — Deploy lên Avalanche Fuji (demo có proof trên Snowtrace)

Mint trên Fuji là giao dịch thật: có tx hash, xem được trên
[Snowtrace](https://testnet.snowtrace.io), NFT hiện trong ví. Đây là thứ mang
đi demo được.

**Chuẩn bị:** ví Core/MetaMask (ví testnet riêng!) + AVAX test từ
<https://build.avax.network/console/primary-network/faucet> (chọn mạng **Fuji C-Chain**).

```bash
# .env.local
NEXT_PUBLIC_CHAIN=fuji
NEXT_PUBLIC_CONTRACT_ADDRESS=      # để trống — mỗi người tự deploy trên web
```

```bash
npm run dev
```

Vào <http://localhost:3000> → **KẾT NỐI VÍ** → màn hình **Bước 1** hiện nguyên
contract `.sol` → bấm **🚀 DEPLOY CONTRACT** → ký trong ví → xong là có contract
của riêng mình, bấm **VÀO MÀN HÌNH MINT →** rồi mint.

**Không cần Remix, không cần private key, không cần sửa file nào.** Sinh viên
chỉ cần trình duyệt + ví + một ít AVAX test.

> **Tốn bao nhiêu?** Base fee Fuji hiện ~10 wei nên gần như miễn phí. Kể cả
> tính theo mức lịch sử 25 nAVAX: deploy ~0.03 AVAX, mỗi lần mint ~0.035 AVAX
> (tokenURI ~1.8KB nằm hẳn trên chain nên tốn ~1.4M gas). Một lần faucet là
> thừa.

### Đi lại giữa 2 bước

Deploy xong sẽ có thanh **① CONTRACT · ② CHỌN & MINT** ở đầu trang — bấm qua
lại thoải mái. Quay về bước 1 vẫn thấy nguyên code `.sol` cùng địa chỉ contract
đang dùng (kèm link Snowtrace), và 2 lựa chọn: **VÀO MÀN HÌNH MINT →** để quay
lại, hoặc **QUÊN CONTRACT NÀY** nếu muốn deploy cái mới. Footer cũng có link
**XEM CONTRACT**.

### Contract của bạn lưu ở đâu

Địa chỉ nằm trong `localStorage` của trình duyệt (khoá
`avaxcats:contract:<chainId>`), nên F5 vẫn còn. Muốn làm lại từ đầu thì bấm
**DEPLOY CONTRACT KHÁC** ở footer.

Bytecode được compile sẵn lúc build (`npm run artifact` → `src/lib/artifact.ts`,
5.7KB) nên bấm DEPLOY là gửi luôn, không phải tải solc 9MB về máy.

<details>
<summary><b>Cách khác — cả lớp dùng chung 1 contract</b></summary>

Giảng viên deploy một lần rồi cho cả lớp dùng chung, mỗi con mèo chỉ một người
lấy được — hết 48 con là hết, nhìn lưới xám dần rất đã.

```bash
npm run set-contract 0xĐịaChỉContractChung
```

Lệnh này kiểm tra địa chỉ (có bytecode chưa, đúng AvaxCats chưa, đúng 48 con
chưa) rồi mới ghi vào `.env.local` và `../mint-site/config.js`. Ai đã tự deploy
contract riêng thì bấm **DEPLOY CONTRACT KHÁC** ở footer để quay về contract
chung.
</details>

<details>
<summary><b>Cách khác — deploy bằng Remix hoặc bằng CLI</b></summary>

**Remix:** mở <https://remix.ethereum.org>, copy
[`contracts/AvaxCats.sol`](contracts/AvaxCats.sol), Compile `0.8.20`+,
Environment **Injected Provider** (ví đang ở Fuji), **Deploy** → copy địa chỉ ở
mục *Deployed Contracts* → `npm run set-contract 0x...`.

**CLI:** điền `DEPLOYER_PRIVATE_KEY=0x...` (ví testnet rác!) vào `.env.local`
rồi `npm run deploy:fuji`. Nhanh nhưng phải để private key trong file text.
</details>

## Thu thập KPI (Bước 3 — form đăng ký)

Sau khi mint xong, sinh viên bấm **③ ĐĂNG KÝ** và điền:

| Ô | Nguồn |
|---|---|
| GitHub / Gmail (đã đăng ký Builder Hub) | gõ tay |
| Tên | gõ tay |
| Telegram | gõ tay — `@handle`, `t.me/handle` hay handle trơn đều được, app tự chuẩn hoá về `@handle` |
| Contract đã deploy | **tự điền** từ Bước 1 |
| Ví | **tự điền** từ ví đang kết nối |
| Số NFT đã mint | **tự đọc** `balanceOf` trên chain |

Dữ liệu chảy thẳng vào một Google Sheet. Dựng trong 2 phút:

1. Tạo Google Sheet mới → menu **Tiện ích mở rộng → Apps Script**
2. Xoá hết code mẫu, dán nội dung [`docs/kpi-apps-script.gs`](docs/kpi-apps-script.gs)
3. **Triển khai → Tuỳ chọn triển khai mới → Ứng dụng web**
   - Thực thi với tư cách: **Tôi**
   - Ai có quyền truy cập: **Bất kỳ ai** ← bắt buộc, không thì trình duyệt sinh viên bị chặn
4. Copy URL `https://script.google.com/macros/s/…/exec` → dán vào `.env.local`:
   ```
   NEXT_PUBLIC_KPI_ENDPOINT=https://script.google.com/macros/s/…/exec
   ```
5. Restart `npm run dev`

Sheet tự tạo tab **KPI** với đủ 10 cột ngay lần gửi đầu tiên.

> **Một điểm phải biết:** Apps Script trả lời POST bằng một chuỗi redirect
> (302 → `script.googleusercontent.com` → …). Nếu để trình duyệt tự đi hết
> chuỗi đó, tài khoản Google đang đăng nhập có thể làm hop cuối trả 404 dù dòng
> đã ghi vào Sheet. App gửi với `redirect: "manual"`: nhận được 302 đầu tiên
> (`opaqueredirect`) nghĩa là script đã chạy → báo "đã gửi". Không có 302 (dán
> nhầm URL) thì rơi xuống `no-cors` và nói thẳng "chưa xác nhận được — kiểm tra
> Sheet". Đừng sửa thành báo "thành công" vô điều kiện.

Chưa cấu hình endpoint thì form vẫn hiện, có cảnh báo vàng, và nút gửi báo lỗi
rõ ràng chứ không im lặng.

## Bảng lệnh

| Lệnh | Việc nó làm |
|---|---|
| `npm run anvil` | Bật blockchain local (cổng lấy từ `.env.local`) |
| `npm run compile` | Chỉ compile contract để kiểm tra cú pháp |
| `npm run deploy:anvil` | Deploy lên anvil (dùng sẵn tài khoản #0, không cần key) |
| `npm run deploy:fuji` | Deploy lên Fuji (cần `DEPLOYER_PRIVATE_KEY`) |
| `npm run fund 0x...` | Nạp AVAX giả cho ví của bạn trên anvil (chỉ local) |
| `npm run set-contract 0x...` | Trỏ app vào contract deploy sẵn — kiểm tra rồi mới ghi `.env.local` |
| `npm run artifact` | Compile lại contract thành `src/lib/artifact.ts` (tự chạy trước `dev`/`build`) |
| `npm run deploy` | Deploy lên mạng đang ghi trong `NEXT_PUBLIC_CHAIN` |
| `npm run test:contract` | 24 test end-to-end trên anvil |
| `npm run dev` | Chạy web ở <http://localhost:3000> |
| `npm run local` | Gộp: `deploy:anvil` rồi `dev` |
| `npm run build` | Build production + kiểm tra TypeScript |

## Biến trong `.env.local`

| Biến | Ý nghĩa |
|---|---|
| `NEXT_PUBLIC_CHAIN` | `anvil` (mặc định) hoặc `fuji` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Địa chỉ contract — script deploy tự ghi |
| `NEXT_PUBLIC_RPC_URL` | RPC của anvil, chỉ cần khi đổi cổng |
| `DEPLOYER_PRIVATE_KEY` | Chỉ bắt buộc khi deploy Fuji |

Sửa `.env.local` xong nhớ **restart `npm run dev`**.

---

## dApp hoạt động thế nào? (lộ trình đọc code)

1. **`lib/chains.ts`** — khai báo 2 mạng, chọn 1 bằng biến môi trường.
   Nhờ vậy không component nào hardcode "Fuji" cả.
2. **`lib/wagmi.ts`** — `createConfig` là "1 nguồn sự thật" cho mọi hook:
   chain nào, connector nào, RPC nào. Connector `mock()` (ví dev) chỉ được
   thêm vào khi chạy anvil.
3. **`app/providers.tsx`** — `WagmiProvider` + `QueryClientProvider` bọc
   app; mọi hook wagmi bên dưới đều đọc config từ đây.
4. **`components/WalletBar.tsx`** — `useConnect` xin quyền ví,
   `useAccount` theo dõi địa chỉ/chainId, `useSwitchChain` xin ví nhảy
   sang đúng mạng, `useBalance` đọc số dư.
5. **`components/SupplyBadge.tsx`** — `useReadContract` gọi view function
   qua RPC (không cần ví!), `refetchInterval` tự cập nhật khi cả lớp mint.
6. **`lib/metadata.ts`** — dựng tokenURI chuẩn ERC-721:
   `data:application/json;base64,...` — ảnh nhúng luôn, không cần IPFS.
7. **`components/MintPanel.tsx`** — `useWriteContract` gửi tx →
   `useWaitForTransactionReceipt` chờ xác nhận → `parseEventLogs` (viem)
   móc event `Minted` ra lấy `tokenId`.
8. **`components/MyCats.tsx`** — chiều ngược lại: `useReadContracts` gọi
   `ownerOf` + `tokenURI` cho N token gần nhất, giải mã base64 và vẽ ra.
   Ảnh hiện ở mục này đến TỪ blockchain, không phải từ `cats.ts`.

## Câu hỏi thảo luận cho lớp

- Vì sao `SupplyBadge` đọc được dữ liệu khi CHƯA kết nối ví?
  (gợi ý: read qua RPC ≠ write cần chữ ký)
- Anvil ký hộ giao dịch được, còn Fuji thì không. Điều đó nói lên ví
  thật sự làm gì cho ta?
- Nhúng ảnh vào tokenURI vs. dùng IPFS — ưu nhược điểm? Mint 1 con tốn
  ~1.39 triệu gas (xem output `npm run test:contract`); trên mainnet
  chừng đó là bao nhiêu tiền?
- `_safeMint` khác gì `_mint`? Chuyện gì xảy ra nếu `to` là contract
  không nhận được ERC-721?
- 2 sinh viên mint cùng 1 con mèo thì sao? (tokenId khác nhau — NFT là
  token, không phải bức ảnh — xem test số 6)
- Bài tập: sửa contract giới hạn mỗi ví 1 lần mint; thêm phí mint
  0.01 AVAX (`payable`); viết thêm test cho luật vừa thêm.

## Sự cố thường gặp

| Triệu chứng | Nguyên nhân / cách sửa |
|---|---|
| "chưa deploy — chạy npm run deploy:anvil" | Chưa deploy, hoặc sửa `.env.local` mà chưa restart `npm run dev` |
| "không đọc được contract — anvil còn chạy chứ?" | Anvil đã tắt/restart (mất state) → bật lại rồi `npm run deploy:anvil` |
| `deploy:anvil` báo "Không kết nối được anvil" | Chưa chạy `npm run anvil` ở tab khác |
| `deploy:anvil` báo "chainId 143, không phải 31337" | Cổng 8545 đang bị một anvil/node khác chiếm → đặt `NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8546` |
| `deploy:fuji` báo thiếu key | Điền `DEPLOYER_PRIVATE_KEY=0x...` (ví testnet riêng) vào `.env.local` |
| "Sai mạng" | Bấm nút CHUYỂN SANG…, ví sẽ tự thêm mạng nếu chưa có |
| Mint fail "insufficient funds" **trên anvil** | Bạn bấm KẾT NỐI VÍ bằng Core/MetaMask — anvil chỉ phát tiền cho 10 tài khoản của chính nó, ví bạn có số dư 0. Dùng nút **VÍ DEV (ANVIL)**, hoặc `npm run fund <địa chỉ ví>` |
| Mint fail "insufficient funds" **trên Fuji** | Ví hết AVAX test — quay lại faucet |
| Bấm nút không ăn gì, console 403 | Đang mở bằng IP lạ — dùng `localhost:3000`, hoặc thêm host vào `allowedDevOrigins` trong `next.config.ts` |
| Trang trắng khi build | `npm run build` để xem lỗi TypeScript |

## Phiên bản HTML thuần

Bản tối giản không framework (1 file `index.html` + ethers.js CDN) nằm ở
`../mint-site/` — cũng chạy được cả anvil lẫn Fuji, dùng cho buổi đầu để
hiểu bản chất trước khi lên Next.js + wagmi.

## Sinh lại bộ mèo

```bash
# từ thư mục gốc nullcat/
python3 generate.py --count 48 --seed 1337
python3 build_mint_site.py     # ghi cả mint-site/cats.js lẫn mint-dapp/src/lib/cats.ts
```
