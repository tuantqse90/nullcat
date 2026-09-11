import { EXPLORER, isLocal } from "./chains";

// ❓ ABI là gì và vì sao viết tay ở đây?
// → ABI mô tả tên hàm, tham số, kiểu trả về để viem encode/decode call data. Chỉ khai báo những hàm
//   frontend dùng (mint, mintedBitmap, ownerOf, tokenURI...) cho gọn; hàm khác của ERC-721 không cần liệt kê.
export const AVAXCATS_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "catId", type: "uint256" },
      { name: "uri", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintedBitmap",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "catMinted",
    stateMutability: "view",
    inputs: [{ name: "catId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "COLLECTION_SIZE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalMinted",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_SUPPLY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "Minted",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "catId", type: "uint256", indexed: true },
    ],
  },
// ❓ "as const" ở cuối mảng ABI có tác dụng gì?
// → Giữ nguyên kiểu literal để TypeScript suy ra được: functionName chỉ được là "mint" | "ownerOf"...,
//   args đúng kiểu (bigint, string), kết quả đúng kiểu. Bỏ "as const" là mất toàn bộ type-safety.
] as const;

export const explorerTx = (hash: string) =>
  EXPLORER ? `${EXPLORER}/tx/${hash}` : null;
export const explorerNft = (address: string, tokenId: bigint | string) =>
  EXPLORER ? `${EXPLORER}/nft/${address}/${tokenId}` : null;

// ❓ Vì sao các hàm explorer trả về null trên anvil?
// → Anvil là chain local, không có block explorer. Component nhận null thì hiện hash thô thay vì link.
export const explorerAddress = (address: string) =>
  EXPLORER ? `${EXPLORER}/address/${address}` : null;

export { EXPLORER, isLocal };
