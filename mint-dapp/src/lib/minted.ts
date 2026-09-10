"use client";

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { activeChain, POLL_MS } from "./chains";
import { CATS } from "./cats";
import { AVAXCATS_ABI } from "./contract";
import { useContractAddress } from "./deployed";

export function useMintedCats() {
  const { address, isConfigured } = useContractAddress();
  const { data: bitmap, refetch } = useReadContract({
    abi: AVAXCATS_ABI,
    address,
    chainId: activeChain.id,
    functionName: "mintedBitmap",

    query: { enabled: isConfigured, refetchInterval: POLL_MS },
  });

  return useMemo(() => {
    const bits = bitmap ?? 0n;
    const taken = CATS.map((_, i) => ((bits >> BigInt(i)) & 1n) === 1n);
    const available = taken.reduce<number[]>((acc, t, i) => (t ? acc : [...acc, i]), []);
    return { taken, available, mintedCount: taken.filter(Boolean).length, refetch };
  }, [bitmap, refetch]);
}
