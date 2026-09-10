// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AvaxCats is ERC721URIStorage {

    uint256 public constant COLLECTION_SIZE = 48;

    uint256 public constant MAX_SUPPLY = COLLECTION_SIZE;

    uint256 public totalMinted;
    mapping(uint256 => bool) public catMinted;
    mapping(uint256 => uint256) public catOf;

    event Minted(address indexed to, uint256 indexed tokenId, uint256 indexed catId);

    error CatDoesNotExist(uint256 catId);
    error CatAlreadyMinted(uint256 catId);

    constructor() ERC721("AvaxCats - Team1 VN", "ACAT") {}

    function mint(uint256 catId, string memory uri) external returns (uint256) {
        if (catId >= COLLECTION_SIZE) revert CatDoesNotExist(catId);
        if (catMinted[catId]) revert CatAlreadyMinted(catId);

        catMinted[catId] = true;
        uint256 tokenId = ++totalMinted;
        catOf[tokenId] = catId;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        emit Minted(msg.sender, tokenId, catId);
        return tokenId;
    }

    function mintedBitmap() external view returns (uint256 bits) {
        for (uint256 i; i < COLLECTION_SIZE; ++i) {
            if (catMinted[i]) bits |= (1 << i);
        }
    }
}
