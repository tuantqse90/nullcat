// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ❓ Vì sao không tự viết ERC-721 mà import của OpenZeppelin?
// → ERC721URIStorage đã có sẵn ownerOf, transfer, approve, tokenURI... và đã được audit.
//   Ta chỉ viết phần logic riêng: ai được mint con nào, mỗi con một lần.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AvaxCats is ERC721URIStorage {

    // ❓ constant khác biến thường ở đâu?
    // → Giá trị được ghi thẳng vào bytecode lúc compile: đọc không tốn gas SLOAD và không ai đổi được.
    uint256 public constant COLLECTION_SIZE = 48;

    uint256 public constant MAX_SUPPLY = COLLECTION_SIZE;

    // ❓ Ba biến state này lưu gì?
    // → totalMinted: số token đã phát hành (cũng là tokenId tiếp theo).
    //   catMinted[catId]: con mèo này đã có chủ chưa. catOf[tokenId]: token này là con mèo số mấy.
    //   public tự sinh getter, nên frontend đọc được trực tiếp qua ABI.
    uint256 public totalMinted;
    mapping(uint256 => bool) public catMinted;
    mapping(uint256 => uint256) public catOf;

    // ❓ Đã có return value, cần event làm gì?
    // → Return value chỉ nhận được khi gọi trực tiếp (call). Frontend gửi transaction thì chỉ có receipt,
    //   nên phải đọc tokenId từ event trong receipt.logs. indexed cho phép lọc log theo địa chỉ / tokenId / catId.
    event Minted(address indexed to, uint256 indexed tokenId, uint256 indexed catId);

    // ❓ Custom error khác gì require("chuỗi lỗi")?
    // → Rẻ gas hơn chuỗi text, và frontend nhận diện được đúng tên lỗi (CatAlreadyMinted)
    //   để hiện thông báo phù hợp thay vì "execution reverted" chung chung.
    error CatDoesNotExist(uint256 catId);
    error CatAlreadyMinted(uint256 catId);

    // ❓ Tên và ký hiệu token đặt ở đâu?
    // → Truyền vào constructor của ERC721 đúng một lần lúc deploy; sau đó không đổi được.
    constructor() ERC721("AvaxCats - Team1 VN", "ACAT") {}

    // ❓ Vì sao mint nhận thêm uri thay vì contract tự tạo metadata?
    // → Frontend đã đóng gói ảnh + thuộc tính thành data URI base64; contract chỉ lưu chuỗi đó.
    //   Không IPFS, không server: toàn bộ NFT nằm trên chain. Đổi lại tokenURI dài (~1.8KB) nên mint tốn ~1.4M gas.
    function mint(uint256 catId, string memory uri) external returns (uint256) {
        // ❓ Hai dòng kiểm tra này quan trọng thế nào?
        // → Đây là "luật" của bộ sưu tập: chỉ 48 con, mỗi con một lần.
        //   Giao diện có thể bị sửa hoặc gọi thẳng contract, nhưng luật nằm ở đây thì không lách được.
        if (catId >= COLLECTION_SIZE) revert CatDoesNotExist(catId);
        if (catMinted[catId]) revert CatAlreadyMinted(catId);

        // ❓ Vì sao cập nhật state trước rồi mới _safeMint?
        // → Pattern checks-effects-interactions: đổi state xong mới gọi ra ngoài, chặn reentrancy.
        catMinted[catId] = true;
        // ❓ ++totalMinted khác totalMinted++ chỗ nào?
        // → Tăng trước rồi mới lấy giá trị, nên token đầu tiên có id = 1, không có token 0.
        uint256 tokenId = ++totalMinted;
        catOf[tokenId] = catId;

        // ❓ _safeMint khác _mint chỗ nào?
        // → Nếu người nhận là contract, _safeMint kiểm tra nó có biết nhận ERC-721 không (onERC721Received),
        //   tránh NFT bị kẹt vĩnh viễn trong một contract không xử lý được.
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        emit Minted(msg.sender, tokenId, catId);
        return tokenId;
    }

    // ❓ Đã có catMinted, cần mintedBitmap để làm gì?
    // → Frontend cần trạng thái của cả 48 con; gọi catMinted 48 lần là 48 RPC call.
    //   Gói 48 bit vào một uint256 (bit i = 1 nghĩa là mèo i đã mint): một lần đọc là đủ. view nên không tốn gas.
    function mintedBitmap() external view returns (uint256 bits) {
        for (uint256 i; i < COLLECTION_SIZE; ++i) {
            if (catMinted[i]) bits |= (1 << i);
        }
    }
}
