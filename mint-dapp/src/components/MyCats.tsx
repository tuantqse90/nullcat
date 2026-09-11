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
  // ❓ Component này cần gì từ ví?
  // → address để lọc token nào là của mình (so với ownerOf); isConnected để ẩn cả section khi chưa kết nối.
  const { address, isConnected } = useAccount();
  const { address: contract, isConfigured } = useContractAddress();

  // ❓ Vì sao phải đọc totalMinted trước?
  // → Contract không có hàm "liệt kê token của address X" (không dùng ERC721Enumerable để tiết kiệm gas). Nên ta lấy
  //   tổng số token đã mint rồi tự duyệt ngược từng id. refetchInterval để bảng tự cập nhật khi có mint mới.
  const { data: totalMinted } = useReadContract({
    abi: AVAXCATS_ABI,
    address: contract,
    chainId: activeChain.id,
    functionName: "totalMinted",
    query: { enabled: isConfigured, refetchInterval: POLL_MS },
  });

  // ❓ LOOKBACK = 48 nghĩa là gì, và vì sao đếm ngược?
  // → Chỉ quét 48 token gần nhất (từ total xuống total-47, không dưới 1) để giới hạn số RPC call. Đếm ngược để token mới
  //   nhất nằm đầu bảng. tokenId bắt đầu từ 1 (contract dùng ++totalMinted) nên Math.max(1, …); BigInt vì uint256.
  const ids = useMemo(() => {
    const total = Number(totalMinted ?? 0n);
    const from = Math.max(1, total - LOOKBACK + 1);
    return Array.from({ length: Math.max(0, total - from + 1) }, (_, i) =>
      BigInt(total - i),
    );
  }, [totalMinted]);

  // ❓ useReadContracts khác useReadContract chỗ nào?
  // → Gộp nhiều lệnh đọc (ownerOf + tokenURI cho mỗi id → tối đa 96 call) thành MỘT request multicall, nhanh hơn nhiều
  //   so với 96 request lẻ. Kết quả là mảng theo đúng thứ tự contracts[] → reads[i*2] là owner, reads[i*2+1] là uri.
  //   enabled chặn gọi khi chưa có id nào (total = 0).
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

  // ❓ Lọc token của mình như thế nào?
  // → Với mỗi id: lấy owner, so với address của ví, rồi giải mã tokenURI (JSON base64 on-chain) thành name/image.
  //   parseTokenURI trả null nếu uri không đúng format → bỏ qua token đó thay vì làm vỡ cả bảng.
  const mine = useMemo(() => {
    if (!reads || !address) return [];
    return ids
      .map((id, i) => {
        const owner = reads[i * 2]?.result as `0x${string}` | undefined;
        const uri = reads[i * 2 + 1]?.result as string | undefined;
        // ❓ Vì sao phải toLowerCase khi so sánh địa chỉ?
        // → Cùng một địa chỉ có thể ở dạng checksum (EIP-55, xen kẽ hoa/thường) hoặc toàn chữ thường tuỳ ví/RPC; so sánh
        //   thẳng bằng === sẽ bỏ sót NFT của chính mình.
        if (!owner || owner.toLowerCase() !== address.toLowerCase()) return null;
        const meta = uri ? parseTokenURI(uri) : null;
        return meta ? { id, meta } : null;
      })
      // ❓ `(x): x is {...}` là gì?
      // → Type predicate: báo cho TypeScript rằng sau filter mảng không còn null. Không có nó kiểu vẫn là (T | null)[] và
      //   JSX bên dưới phải kiểm tra null lại.
      .filter((x): x is { id: bigint; meta: NonNullable<ReturnType<typeof parseTokenURI>> } => x !== null);
  }, [reads, ids, address]);

  // ❓ Sao return null ở đây mà không đặt trước các hook?
  // → Quy tắc của React: hooks phải được gọi cùng số lượng, cùng thứ tự ở mọi lần render. Return sớm TRƯỚC
  //   useReadContract sẽ làm React ném lỗi "Rendered fewer hooks than expected".
  if (!isConfigured || !isConnected) return null;

  const cols = "grid-cols-[3.5rem_2.5rem_1fr_5rem] sm:grid-cols-[4rem_3rem_1fr_10rem_6rem]";

  return (
    <section className="anim-rise mt-16">
      <h2 className="display text-[1.75rem] text-fg sm:text-3xl md:text-5xl">
        On chain<span className="text-avax">.</span>
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
        Read straight from the contract via{" "}
        <code className="font-mono text-[13px] text-fg">ownerOf</code> +{" "}
        <code className="font-mono text-[13px] text-fg">tokenURI</code>. The images below
        are decoded from on-chain data, not from cats.ts.
      </p>

      <div className="mt-8 border-y border-line bg-surface-solid px-5 py-4 md:px-6">
        <div className={`grid ${cols} items-center gap-4 border-b border-line-strong pb-2`}>
          <span className="eyebrow text-fg">Token</span>
          <span />
          <span className="eyebrow text-muted">Name</span>
          <span className="eyebrow hidden text-right text-muted sm:block">Owner</span>
          <span className="eyebrow text-right text-muted">Explorer</span>
        </div>

        {mine.length === 0 ? (
          <p className="py-6 text-sm text-muted">
            {isLoading
              ? "Reading the chain…"
              : `No NFTs for this wallet in the last ${LOOKBACK} tokens.`}
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
