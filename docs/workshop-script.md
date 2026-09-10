# Speaking script — Building on Avalanche (Team1 VN workshop)

Deck: Canva "Avalanche Team1 Workshop Template", 18 slide. Giọng trình bày: ngắn, nêu sự thật, không hô hào. [DEMO] = thao tác trên màn hình.

## Việc cần chốt trước buổi

- Kịch bản mint. Site đang để mỗi người tự deploy contract riêng. Nếu muốn cả lớp mint chung 48 con như slide 15 ghi, deploy một contract trước, chạy `npm run set-contract 0x…`, build và deploy lại site.
- Slide 13 và 18 ghi repo `tuantqse90/avaxcats`. Repo thật là `tuantqse90/nullcat`, đang private. Đổi tên repo hoặc sửa slide.
- Slide 18 ghi faucet cũ `faucet.avax.network`. Faucet hiện tại: `build.avax.network/console/primary-network/faucet`.
- Agenda ghi 60 phút, presenter notes ghi 90. Thống nhất một con số.
- Ví Core của người trình bày có sẵn AVAX Fuji, cộng một ví dự phòng để chuyển cho người bị faucet từ chối.
- Mở sẵn bốn tab: team1vn.xyz, faucet Builder Console, testnet.snowtrace.io, repo.
- Người dùng điện thoại: mở team1vn.xyz trong app Core, tab Browser. Safari và Chrome trên điện thoại không kết nối được với Core.

---

## 1. Building on Avalanche — 1 phút

- Xác định phòng bằng hai câu hỏi: ai đã viết Solidity, ai chưa từng deploy contract.
- Nêu mục tiêu buổi học: mỗi người kết thúc với một contract ERC-721 chạy trên Fuji testnet và một NFT do chính ví của mình mint.
- Nêu cấu trúc: nền tảng mạng, ví và testnet, contract và mint, bước tiếp theo. Phần ba chiếm gần nửa thời lượng và là phần thực hành.

## 2. About the speaker — 1 phút

- Tên, vai trò: Developer Relations, Team1 Vietnam.
- Hai điểm liên quan đến buổi học: kinh nghiệm build sản phẩm production, và giải top 3 Avalanche Hackathon 2022 — cùng hệ sinh thái với nội dung hôm nay.
- Các giải còn lại chỉ đọc lướt, không dừng.

## 3. Agenda — 1 phút

- Bốn khối theo thứ tự trên slide, nêu thời lượng từng khối.
- Khối 3 là thực hành. Yêu cầu người chưa có Node.js cài ngay trong lúc trình bày khối 1, phiên bản 20 trở lên.

## 4. Reference — 1 phút

- Bốn nguồn chính thức: Academy (khoá học có lộ trình), Docs (tham chiếu Primary Network, RPC, chain ID), Console (faucet, tạo L1, validator), Builder Hub (trang tổng hợp).
- Đề nghị lưu hai link: Academy để học tiếp sau buổi này, Builder Hub để theo dõi sự kiện và grant.
- [DEMO] Mở build.avax.network, chỉ vị trí bốn mục trên thanh điều hướng.

## 5. Academy badges — 1 phút

- Mỗi khoá kết thúc bằng bài đánh giá. Đạt thì nhận badge trên profile công khai; hoàn thành cả track nhận Graduate badge.
- Giá trị thực tế: bằng chứng năng lực dùng được trong CV và hồ sơ xin grant.
- Lộ trình đề xuất: Blockchain Fundamentals, sau đó Avalanche L1 Academy.

## 6. Network foundations — 15 giây

- Chuyển đoạn: trước khi viết code cần một mô hình đúng về mạng. Ba chain, một bộ validator, finality dưới một giây.

## 7. Built to be many chains — 3 phút

- Ý chính: phần lớn mạng scale bằng cách đưa mọi ứng dụng lên một chain. Avalanche dùng chung validator và consensus, còn số chain thì không giới hạn.
- Bốn điểm, mỗi điểm một câu, không đọc nhãn trên slide:
  - Finality dưới một giây: giao dịch là cuối cùng ngay khi xác nhận, ứng dụng không cần trạng thái chờ nhiều block.
  - Solidity chạy không sửa: contract của buổi hôm nay là OpenZeppelin ERC-721 tiêu chuẩn.
  - Hàng nghìn node trên phần cứng phổ thông.
  - Chain riêng khi cần: cuối buổi tạo một L1 trên Console trong bốn bước.

## 8. Architecture — 2 phút

- Mô tả cấu trúc: một bộ validator ở dưới, ba chain chuyên biệt ở trên.
- P-Chain: staking, đăng ký validator, danh bạ L1. X-Chain: tạo và chuyển tài sản, sổ cái DAG. C-Chain: EVM, nơi Solidity chạy.
- Toàn bộ buổi hôm nay làm việc trên C-Chain. Chain ID Fuji: 43113.

## 9. Wallet — 4 phút, làm cùng phòng

- [DEMO] core.app/download. Extension cho laptop, App Store và Google Play cho điện thoại.
- Tạo ví mới, ghi 24 từ khôi phục ra giấy. Nêu rõ: cụm từ này là ví; ai có nó là chủ ví; không có cơ chế khôi phục nếu mất.
- Người cần nhanh có thể đăng nhập bằng Gmail, tạo ví 24 từ sau.
- Bật Testnet mode trong Settings để hiển thị Fuji.

## 10. Testnet AVAX — 3 phút

- Bốn bước trên slide: mở faucet trong Console, đăng nhập GitHub, chọn Fuji C-Chain và dán địa chỉ, kiểm tra số dư trong Core.
- Lưu ý: faucet giới hạn theo tài khoản GitHub, đăng nhập trước khi thao tác.
- AVAX Fuji không có giá trị và không mua được. Nếu faucet hết, người trình bày chuyển trực tiếp.
- [DEMO] Thực hiện một lượt với ví của người trình bày.

## 11. Confirmation — 1 phút

- Kết quả mong đợi: 0.5 AVAX trên C-Chain, đủ cho hàng trăm lần deploy.
- Badge Funded xác nhận yêu cầu đã được xử lý.
- Cùng trang có faucet cho các L1 khác (Echo, Dispatch, Dexalot), không dùng hôm nay.

## 12. Contracts, and your first AvaxCat — 2 phút

- Từ đây làm việc trên một repo: AvaxCats của Team1 VN.
- Pipeline theo mũi tên trên slide:
  - Generator `nullcat`: Python thuần, không phụ thuộc, sinh 48 ảnh 32×32 và metadata.
  - `AvaxCats.sol`: ERC-721 OpenZeppelin, tokenURI là data URI base64 lưu trên chain, không dùng IPFS.
  - Deploy: một lệnh CLI, hoặc một nút trên web ký bằng ví.
  - dApp Next.js để mint và đọc lại NFT từ chain.

## 13. Before we start — 3 phút

- Kiểm tra ba lệnh: `node -v` (20 trở lên), `npm -v`, `git --version`. Báo ngay nếu thiếu.
- Python chỉ cần khi sinh lại ảnh; 48 con đã có trong repo.
- Clone-and-run dành cho người muốn chạy local: clone, `cd mint-dapp`, `npm install`, copy `.env.example` thành `.env.local`, `npm run dev`.
- Đường ngắn nhất, và là đường sẽ demo: mở team1vn.xyz, deploy và mint trực tiếp bằng ví, không cần cài đặt.

## 14. The project — 3 phút

- [DEMO] Mở team1vn.xyz, nêu ngắn: 48 con trên thanh chạy ngang, bốn con 1/1 vẽ tay nằm ngoài phân phối ngẫu nhiên.
- Bốn bước, mỗi bước một câu:
  - Generate: roll trait theo trọng số độ hiếm, 18 lớp, 139 trait, mỗi tổ hợp là duy nhất.
  - Contract: `mint(catId, uri)`, mỗi catId mint được một lần, ràng buộc nằm trong contract.
  - Deploy: bytecode compile sẵn lúc build, ví ký giao dịch tạo contract, không cần Remix hay private key trong file.
  - Mint: gửi giao dịch bằng wagmi và viem, đọc event Minted để lấy tokenId, đọc `ownerOf` và `tokenURI` để hiển thị lại từ chain.
- [DEMO] Mở repo, chỉ ba file: `contracts/AvaxCats.sol`, `scripts/deploy.mjs`, `src/components/MintPanel.tsx`. Không đi vào chi tiết.

## 15. Your turn — 10 phút, hỗ trợ tại chỗ

Demo một lượt trên màn hình lớn, khoảng 2 phút, rồi để phòng tự làm.

- [DEMO] Connect wallet. Nếu ví ở mạng khác, trang hiển thị Switch network; bấm để chuyển sang Fuji. Thanh trạng thái hiển thị mạng, địa chỉ, số dư, số đã mint.
- [DEMO] Bước 01: mã nguồn contract hiển thị đầy đủ. Bấm Deploy contract, xác nhận trong Core. Khi xác nhận xong, trang hiển thị "Contract is live on Fuji" và địa chỉ. Địa chỉ được lưu trong trình duyệt.
- [DEMO] Go to mint. Chọn một con trong lưới hoặc dùng Random. Panel hiển thị 18 trait.
- [DEMO] Mint NFT, xác nhận trong Core. Trạng thái hiển thị tokenId cùng link giao dịch và NFT trên Snowtrace. Bảng "On chain" phía dưới đọc trực tiếp từ contract.
- [DEMO] Core → Collectibles để thấy NFT trong ví.
- [DEMO] Register: Gmail đăng ký Builder Hub, Telegram, X. Contract và ví tự điền. Đây là bước ban tổ chức dùng để ghi nhận hoàn thành.
- Chuyển sang thực hành. Đi từng bàn thay vì đứng ở bục.
- Xử lý sự cố thường gặp:
  - Số dư 0: quay lại faucet, hoặc chuyển 0.2 AVAX từ ví dự phòng.
  - Laptop hiển thị "Install Core Wallet": extension chưa bật hoặc chưa tải lại trang.
  - Điện thoại: mở link trong app Core, tab Browser. Trang có hướng dẫn "Mint on your phone".
  - "Already minted": chỉ xảy ra với contract chung; chọn con khác.
  - Lỗi gas: trang hiển thị nguyên nhân, đưa về faucet.
- Tiêu chí hoàn thành: mỗi người có một NFT hiển thị trên Snowtrace.

## 16. Builder Console — 5 phút

- [DEMO] build.avax.network/console/create-l1, điền trực tiếp:
  - Q1: Basic setup. Subnet, genesis và Validator Manager được điền sẵn.
  - Q2: tên chain và ticker của gas token.
  - Q3: địa chỉ Core nhận genesis supply.
  - Q4: review, chọn Testnet, deploy. Console vận hành validator node.
- Nêu đánh đổi: chain riêng cho quyền kiểm soát phí, token gas và tập validator; đổi lại không có sẵn người dùng và thanh khoản của C-Chain. Chọn theo yêu cầu của sản phẩm.

## 17. After today — 3 phút

- Builder Grant 10.000 USD cho prototype hoạt động. Contract vừa deploy cộng một ý tưởng và thời gian hoàn thiện là đủ để nộp.
- Builder Grant 30.000 USD cho team đã có sản phẩm và người dùng.
- Hackathon dành cho sinh viên sắp diễn ra. Theo dõi Builder Hub và kênh Telegram Team1. Nếu đã có ngày, nêu ngày.

## 18. Resources — giữ slide đến khi kết thúc

- Ba thứ mang về: repo có contract hoàn chỉnh và slide, Docs, faucet.
- Kênh liên lạc: Telegram Avalanche VN (chat chung), Telegram Team1 VN builders, X @Team1VN. Tất cả có ở footer team1vn.xyz.
- Người trình bày ở lại 15 phút hỗ trợ người chưa mint xong.
