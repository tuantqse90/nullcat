import type { Cat } from "./cats";
import { CHAIN_LABEL } from "./chains";

// ❓ tokenURI chuẩn ERC-721 cần gì?
// → Một URL trả về JSON có name, description, image, attributes (chuẩn OpenSea).
//   Ở đây ta không dùng URL http/IPFS mà nhét thẳng JSON vào data URI.
export function buildTokenURI(cat: Cat): string {
  const meta = {
    name: `${cat.name} - Team1 VN`,
    description:
      "AvaxCats - pixel summit cat of Team Avalanche (Team1 VN). " +
      `Minted on ${CHAIN_LABEL} for the academy demo.`,
    image: cat.image,
    attributes: cat.attributes,
  };

  // ❓ Vì sao base64 mà không để JSON thô?
  // → data URI cần chuỗi an toàn (không dấu ngoặc, không unicode lạ); btoa mã hoá JSON thành base64.
  //   cat.image bên trong cũng là data:image/png;base64 nên NFT hoàn toàn tự chứa, không phụ thuộc server nào.
  return "data:application/json;base64," + btoa(JSON.stringify(meta));
}

export type TokenMeta = {
  name: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
};

// ❓ parseTokenURI dùng ở đâu?
// → MyCats đọc tokenURI từ chain rồi giải mã ngược để hiển thị. Nhờ vậy ảnh trên màn hình
//   đến từ dữ liệu on-chain, không phải từ file cats.ts trong repo.
export function parseTokenURI(uri: string): TokenMeta | null {
  const prefix = "data:application/json;base64,";
  if (!uri?.startsWith(prefix)) return null;
  try {
    const m = JSON.parse(atob(uri.slice(prefix.length)));

    if (typeof m?.name !== "string" || typeof m?.image !== "string") return null;
    return {
      name: m.name,
      image: m.image,
      attributes: Array.isArray(m.attributes) ? m.attributes : [],
    };
  } catch {
    return null;
  }
}
