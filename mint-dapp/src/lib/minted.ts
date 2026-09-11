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
    // ❓ Vì sao chỉ gọi một hàm mintedBitmap?
    // → Một RPC call trả về 48 bit trạng thái thay vì 48 call catMinted. refetchInterval để lưới tự cập nhật khi người khác mint.
    functionName: "mintedBitmap",

    query: { enabled: isConfigured, refetchInterval: POLL_MS },
  });

  return useMemo(() => {
    const bits = bitmap ?? 0n;
    // ❓ Dòng này giải mã bitmap thế nào?
    // → Dịch phải i bit rồi AND với 1: nếu còn 1 nghĩa là mèo i đã mint. Phải dùng BigInt vì uint256 vượt quá Number của JS.
    const taken = CATS.map((_, i) => ((bits >> BigInt(i)) & 1n) === 1n);
    const available = taken.reduce<number[]>((acc, t, i) => (t ? acc : [...acc, i]), []);
    return { taken, available, mintedCount: taken.filter(Boolean).length, refetch };
  }, [bitmap, refetch]);
}
