import type { Cat } from "./cats";
import { CHAIN_LABEL } from "./chains";

export function buildTokenURI(cat: Cat): string {
  const meta = {
    name: `${cat.name} - Team1 VN`,
    description:
      "AvaxCats - pixel summit cat of Team Avalanche (Team1 VN). " +
      `Minted on ${CHAIN_LABEL} for the academy demo.`,
    image: cat.image,
    attributes: cat.attributes,
  };

  return "data:application/json;base64," + btoa(JSON.stringify(meta));
}

export type TokenMeta = {
  name: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
};

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
