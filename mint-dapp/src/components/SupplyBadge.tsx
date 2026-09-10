"use client";

import { useReadContract } from "wagmi";
import { activeChain, POLL_MS } from "@/lib/chains";
import { AVAXCATS_ABI } from "@/lib/contract";
import { useContractAddress } from "@/lib/deployed";
import { PulseDot, Stat } from "./ui";

export function SupplyBadge({ className = "" }: { className?: string }) {
  const { address, isConfigured } = useContractAddress();
  const common = { abi: AVAXCATS_ABI, address, chainId: activeChain.id } as const;

  const { data: minted, error } = useReadContract({
    ...common,
    functionName: "totalMinted",
    query: { enabled: isConfigured, refetchInterval: POLL_MS },
  });
  const { data: max } = useReadContract({
    ...common,
    functionName: "MAX_SUPPLY",
    query: { enabled: isConfigured },
  });

  const live = isConfigured && !error && minted !== undefined;

  return (
    <Stat
      className={className}
      label="Đã mint"
      dot={
        <PulseDot
          color={!isConfigured ? "bg-zinc-400" : error ? "bg-amber-500" : "bg-emerald-500"}
          ping={live}
        />
      }
      valueClassName={error ? "text-amber-600 dark:text-amber-400 text-sm md:text-sm" : ""}
      value={
        !isConfigured ? (
          <span className="text-muted">—</span>
        ) : error ? (
          "Không đọc được contract"
        ) : minted === undefined || max === undefined ? (
          <span className="text-muted">…</span>
        ) : (
          <>
            {minted.toString()}
            <span className="text-muted"> / {max.toString()}</span>
          </>
        )
      }
    />
  );
}
