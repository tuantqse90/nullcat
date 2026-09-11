"use client";

import { useReadContract } from "wagmi";
import { activeChain, POLL_MS } from "@/lib/chains";
import { AVAXCATS_ABI } from "@/lib/contract";
import { useContractAddress } from "@/lib/deployed";
import { PulseDot, Stat } from "./ui";

export function SupplyBadge({ className = "" }: { className?: string }) {
  // ❓ Địa chỉ contract lấy từ đâu?
  // → Từ localStorage (sau khi bạn deploy ở bước 1) hoặc từ env NEXT_PUBLIC_CONTRACT_ADDRESS (xem lib/deployed.ts).
  //   isConfigured = true khi chuỗi đó là địa chỉ 0x… hợp lệ; chưa có địa chỉ thì mọi query bên dưới phải tắt.
  const { address, isConfigured } = useContractAddress();
  const common = { abi: AVAXCATS_ABI, address, chainId: activeChain.id } as const;

  // ❓ useReadContract hoạt động thế nào? Có tốn gas không?
  // → Gọi hàm view `totalMinted` qua RPC (eth_call): chỉ đọc, không tạo transaction, không tốn gas, không cần ví.
  //   query.enabled chặn gọi khi chưa có địa chỉ (tránh lỗi "address undefined"); refetchInterval: POLL_MS tự đọc lại
  //   mỗi vài giây để số "Minted" cập nhật khi người khác mint.
  const { data: minted, error } = useReadContract({
    ...common,
    functionName: "totalMinted",
    query: { enabled: isConfigured, refetchInterval: POLL_MS },
  });
  // ❓ Vì sao MAX_SUPPLY không cần refetchInterval?
  // → Đây là `constant` trong contract, ghi thẳng vào bytecode và không bao giờ đổi → đọc một lần là đủ, đỡ tốn RPC.
  const { data: max } = useReadContract({
    ...common,
    functionName: "MAX_SUPPLY",
    query: { enabled: isConfigured },
  });

  // ❓ "live" nghĩa là gì?
  // → Đã có địa chỉ, gọi RPC không lỗi và đã nhận dữ liệu lần đầu (minted !== undefined). Dùng để bật chấm xanh nhấp
  //   nháy; nếu error (sai địa chỉ, sai mạng, RPC chết) chấm chuyển vàng và hiện "Can't read contract".
  const live = isConfigured && !error && minted !== undefined;

  return (
    <Stat
      className={className}
      label="Minted"
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
          "Can't read contract"
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
