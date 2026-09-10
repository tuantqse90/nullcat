"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { activeChain, POLL_MS } from "@/lib/chains";
import { useContractAddress } from "@/lib/deployed";
import {
  AVAXCATS_ABI,
  explorerNft,
} from "@/lib/contract";
import { parseTokenURI } from "@/lib/metadata";
import { Icon } from "./ui";

const LOOKBACK = 48;

export function MyCats() {
  const { address, isConnected } = useAccount();
  const { address: contract, isConfigured } = useContractAddress();

  const { data: totalMinted } = useReadContract({
    abi: AVAXCATS_ABI,
    address: contract,
    chainId: activeChain.id,
    functionName: "totalMinted",
    query: { enabled: isConfigured, refetchInterval: POLL_MS },
  });

  const ids = useMemo(() => {
    const total = Number(totalMinted ?? 0n);
    const from = Math.max(1, total - LOOKBACK + 1);
    return Array.from({ length: Math.max(0, total - from + 1) }, (_, i) =>
      BigInt(total - i),
    );
  }, [totalMinted]);

  const { data: reads, isLoading } = useReadContracts({
    contracts: ids.flatMap((id) => [
      {
        abi: AVAXCATS_ABI,
        address: contract,
        chainId: activeChain.id,
        functionName: "ownerOf",
        args: [id],
      } as const,
      {
        abi: AVAXCATS_ABI,
        address: contract,
        chainId: activeChain.id,
        functionName: "tokenURI",
        args: [id],
      } as const,
    ]),
    query: { enabled: isConfigured && ids.length > 0 },
  });

  const mine = useMemo(() => {
    if (!reads || !address) return [];
    return ids
      .map((id, i) => {
        const owner = reads[i * 2]?.result as `0x${string}` | undefined;
        const uri = reads[i * 2 + 1]?.result as string | undefined;
        if (!owner || owner.toLowerCase() !== address.toLowerCase()) return null;
        const meta = uri ? parseTokenURI(uri) : null;
        return meta ? { id, meta } : null;
      })
      .filter((x): x is { id: bigint; meta: NonNullable<ReturnType<typeof parseTokenURI>> } => x !== null);
  }, [reads, ids, address]);

  if (!isConfigured || !isConnected) return null;

  const cols = "grid-cols-[3.5rem_2.5rem_1fr_5rem] sm:grid-cols-[4rem_3rem_1fr_10rem_6rem]";

  return (
    <section className="anim-rise mt-16">
      <h2 className="display text-[1.75rem] text-fg sm:text-3xl md:text-5xl">
        Đã lên chain<span className="text-avax">.</span>
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
        Đọc thẳng từ contract bằng{" "}
        <code className="font-mono text-[13px] text-fg">ownerOf</code> +{" "}
        <code className="font-mono text-[13px] text-fg">tokenURI</code>. Ảnh dưới đây
        giải mã từ dữ liệu nằm trên chain, không phải từ cats.ts.
      </p>

      <div className="mt-8 border-y border-line bg-surface-solid px-5 py-4 md:px-6">
        <div className={`grid ${cols} items-center gap-4 border-b border-line-strong pb-2`}>
          <span className="eyebrow text-fg">Token</span>
          <span />
          <span className="eyebrow text-muted">Tên</span>
          <span className="eyebrow hidden text-right text-muted sm:block">Chủ sở hữu</span>
          <span className="eyebrow text-right text-muted">Explorer</span>
        </div>

        {mine.length === 0 ? (
          <p className="py-6 text-sm text-muted">
            {isLoading
              ? "Đang đọc chain…"
              : `Chưa thấy NFT nào của ví này trong ${LOOKBACK} token gần nhất.`}
          </p>
        ) : (
          mine.map(({ id, meta }) => {
            const link = explorerNft(contract, id);
            const row = (
              <>
                <span className="font-mono text-sm tabular-nums text-fg">
                  #{id.toString()}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="px size-10 border border-line" src={meta.image} alt={meta.name} />
                <span className="truncate text-sm text-fg">{meta.name}</span>
                <span className="hidden truncate text-right font-mono text-xs text-muted sm:block">
                  {address?.slice(0, 6)}…{address?.slice(-4)}
                </span>
                <span className="eyebrow inline-flex items-center justify-end gap-1 text-muted">
                  {link ? (
                    <>
                      Snowtrace <Icon name="external" className="size-3" />
                    </>
                  ) : (
                    "local"
                  )}
                </span>
              </>
            );
            const cls = `anim-settle grid ${cols} items-center gap-4 border-b border-line py-3 transition-colors last:border-b-0 hover:bg-hover`;
            return link ? (
              <a key={id.toString()} className={cls} href={link} target="_blank" rel="noreferrer">
                {row}
              </a>
            ) : (
              <div key={id.toString()} className={cls}>
                {row}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
