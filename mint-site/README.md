# AvaxCats Mint — bài 1: HTML thuần (anvil local → Fuji testnet)

Demo mint NFT cho lớp academy của **Team Avalanche — Team1 VN** 🇻🇳.
Mọi thứ tối giản: 1 contract ERC-721, 1 trang web tĩnh, không backend,
không build tool, không IPFS (metadata + ảnh nhúng thẳng vào tokenURI
dạng data URI).

```
mint-site/
├── index.html     # trang mint (ethers.js v6 qua CDN, UI tiếng Việt) — KHÔNG sửa
├── config.js      # ← "env" của bài 1: dán địa chỉ contract vào đây
├── cats.js        # 48 con mèo nhúng sẵn (sinh bởi build_mint_site.py)
└── README.md      # file này
```

> **Contract nằm ở đâu?** Chỉ có MỘT file duy nhất cho cả 2 bài:
> [`../mint-dapp/contracts/AvaxCats.sol`](../mint-dapp/contracts/AvaxCats.sol).
> Trước đây mỗi thư mục giữ một bản copy, và hai bản đã lệch nhau thật —
> bản ở đây còn là `mint(uri)` cũ trong khi bài 2 đã chuyển sang
> `mint(catId, uri)`. Deploy nhầm bản cũ là bài 2 chết hoàn toàn. Nên giờ
> bỏ hẳn bản copy: deploy 1 contract, cả 2 trang cùng dùng.

Trang chạy được **2 mạng**, đổi bằng đúng 1 dòng đầu file `index.html`:

```js
const NETWORK = "anvil";   // "anvil" = local trên máy | "fuji" = testnet thật
```

---

## Cách 1 — Chạy local với anvil (không cần ví, không cần faucet)

Cần **Foundry** (`anvil --version`); chưa có thì:
`curl -L https://foundry.paradigm.xyz | bash && foundryup`

**Tab 1 — bật blockchain local:**

```bash
anvil
```

**Tab 2 — deploy contract.** Dễ nhất là mượn script của bài 2:

```bash
cd ../mint-dapp && npm install && npm run deploy:anvil
```

Nó in ra địa chỉ contract (và ghi vào `mint-dapp/.env.local`).
Hoặc deploy bằng foundry nếu bạn thích (phải chỉ chỗ tìm OpenZeppelin —
nó nằm trong `node_modules` của bài 2, nên vẫn cần `npm install` bên đó):

```bash
forge create ../mint-dapp/contracts/AvaxCats.sol:AvaxCats \
  --remappings @openzeppelin/=../mint-dapp/node_modules/@openzeppelin/ \
  --lib-paths ../mint-dapp/node_modules \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

(Private key trên là tài khoản #0 mặc định của anvil — hằng số công khai
của foundry, chỉ có tác dụng trên chain local. Lệnh này tạo thêm thư mục
`out/` + `cache/`, xoá đi được.)

**Tab 3 — dán địa chỉ vào `index.html` rồi mở trang:**

```js
const NETWORK = "anvil";
const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
```

```bash
python3 -m http.server 8000
```

Mở <http://localhost:8000> → bấm **DÙNG VÍ DEV (ANVIL)** → chọn mèo →
**MINT NFT**. Xong, không popup ví, không mất phí.

> **Vì sao không cần ví?** Anvil mở sẵn 10 tài khoản và tự ký hộ giao
> dịch gửi tới nó — trang chỉ việc gọi `provider.getSigner(0)`. Mạng thật
> không bao giờ ký hộ ai, đó chính là công việc của ví.

Kiểm tra kết quả bằng dòng lệnh:

```bash
cast call <CONTRACT> "totalMinted()(uint256)"        --rpc-url http://127.0.0.1:8545
cast call <CONTRACT> "ownerOf(uint256)(address)" 1   --rpc-url http://127.0.0.1:8545
cast call <CONTRACT> "tokenURI(uint256)(string)" 1   --rpc-url http://127.0.0.1:8545
```

⚠️ Tắt anvil là mất sạch state — bật lại phải deploy lại contract.

---

## Cách 2 — Deploy lên Fuji testnet bằng Remix

### Bước 1 — Chuẩn bị ví

1. Cài **Core Wallet** (<https://core.app>) hoặc **MetaMask**, tạo ví mới.
   ⚠️ Ví học tập — không chứa tiền thật.
2. Xin AVAX test tại faucet: <https://build.avax.network/console/primary-network/faucet>
   (chọn mạng **Fuji C-Chain**). Nếu faucet đòi coupon, giảng viên sẽ phát
   coupon hoặc chuyển AVAX test trực tiếp cho cả lớp.

### Bước 2 — Deploy contract bằng Remix

1. Mở <https://remix.ethereum.org>, tạo file mới `AvaxCats.sol`, copy nội dung
   [`../mint-dapp/contracts/AvaxCats.sol`](../mint-dapp/contracts/AvaxCats.sol)
   vào. ⚠️ Phải đúng file này — bản nào không có `mint(catId, uri)` và
   `mintedBitmap()` là sai.
2. Tab **Solidity Compiler** → chọn compiler `0.8.20` trở lên → **Compile**
   (Remix tự tải OpenZeppelin, chờ vài giây).
3. Tab **Deploy & Run Transactions**:
   - Environment: **Injected Provider** (ví sẽ hiện popup — nhớ đang ở mạng
     **Avalanche Fuji**, chainId 43113)
   - Contract: `AvaxCats` → bấm **Deploy** → xác nhận trong ví.
4. Copy **địa chỉ contract** vừa deploy (mục *Deployed Contracts*).

> Mỗi sinh viên có thể tự deploy contract riêng, hoặc cả lớp dùng chung
> 1 contract do giảng viên deploy — cả hai đều được.

### Bước 3 — Cấu hình và chạy trang mint

1. Mở **`config.js`** (không phải `index.html`) và dán địa chỉ vừa copy:
   ```js
   window.AVAXCATS_CONFIG = {
     NETWORK: "fuji",
     CONTRACT_ADDRESS: "0x...",   // địa chỉ Remix trả về
   };
   ```
   Hoặc để máy điền hộ — lệnh này kiểm tra địa chỉ rồi ghi cho **cả hai bài**:
   ```bash
   cd ../mint-dapp && npm run set-contract 0x...
   ```
2. Chạy web server tĩnh ngay trong thư mục `mint-site/`:
   ```bash
   python3 -m http.server 8000
   ```
3. Mở <http://localhost:8000> → **KẾT NỐI VÍ** (trang tự chuyển/thêm mạng
   Fuji) → chọn 1 con mèo → **MINT NFT** → xác nhận giao dịch trong ví.
4. Mint xong, trang hiện link **Snowtrace** để xem giao dịch + NFT:
   <https://testnet.snowtrace.io>. NFT cũng hiện trong tab Collectibles
   của Core Wallet.

---

## Trang web hoạt động thế nào? (đọc code `index.html`)

- **Cấu hình** — `NETWORKS` khai báo thông số 2 mạng đúng định dạng mà ví
  cần cho `wallet_addEthereumChain`; `NET` là mạng đang chọn. Cả trang
  không chỗ nào hardcode Fuji nữa.
- **B1** — vẽ lưới 48 con mèo từ `cats.js` (ảnh 32×32 dạng data URI).
- **B2a** — ví thật: `eth_requestAccounts` xin quyền,
  `wallet_switchEthereumChain` chuyển mạng (tự `wallet_addEthereumChain`
  nếu ví chưa có mạng đó).
- **B2b** — ví dev (chỉ anvil): `new ethers.JsonRpcProvider(...)` +
  `getSigner(0)` — nói chuyện thẳng với node, node ký hộ.
- **B3** — build tokenURI: JSON metadata chuẩn ERC-721 (name, description,
  image, attributes) → base64 → `data:application/json;base64,...`
- **B4** — gọi `contract.mint(uri)` qua ethers.js, chờ receipt, đọc
  `tokenId` từ event `Minted`.

## Câu hỏi thảo luận cho lớp

- Tại sao demo này nhúng ảnh vào tokenURI thay vì dùng IPFS?
  Ưu/nhược điểm? (gợi ý: phí gas ~1KB storage vs. tính phân tán)
- "Ví dev" của anvil ký hộ được, ví thật thì bắt bạn bấm xác nhận.
  Sự khác nhau đó bảo vệ bạn khỏi điều gì?
- `_safeMint` khác gì `_mint`?
- Điều gì xảy ra nếu 2 sinh viên cùng mint 1 con mèo giống nhau?
  (gợi ý: tokenId khác nhau — NFT là token, không phải bức ảnh)
- Làm sao giới hạn mỗi ví chỉ mint 1 lần? Thử sửa contract!

## Sinh lại `cats.js` sau khi đổi bộ mèo

```bash
# từ thư mục gốc nullcat/
python3 generate.py --count 48 --seed 1337
python3 build_mint_site.py
```
