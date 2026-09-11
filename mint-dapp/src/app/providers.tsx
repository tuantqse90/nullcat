"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";

export function Providers({ children }: { children: React.ReactNode }) {
  // ❓ Vì sao tạo QueryClient trong useState?
  // → Để mỗi phiên render chỉ có đúng một client (cache dữ liệu on-chain), không bị tạo lại mỗi lần re-render.
  const [queryClient] = useState(() => new QueryClient());
  return (
    // ❓ Hai Provider này làm gì?
    // → WagmiProvider phát config (chain, connector) xuống mọi hook wagmi.
    //   QueryClientProvider là TanStack Query: cache, refetch và trạng thái loading cho mọi lần đọc chain.
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
