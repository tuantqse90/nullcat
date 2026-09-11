"use client";

import { useState } from "react";
import { useConnect } from "wagmi";
import { currentUrl, metamaskDeepLink, useHasInjected, useIsMobile } from "@/lib/wallet";
import { Button, Icon } from "./ui";

type Size = "md" | "lg";

export function useWalletOptions() {
  // ❓ connectors là gì và từ đâu ra?
  // → Danh sách các cách kết nối ví đã khai báo trong lib/wagmi.ts (injected, walletConnect, mock). connect({ connector })
  //   mở ví tương ứng; isPending = true trong lúc chờ người dùng bấm "Connect" trong ví → disable mọi nút để khỏi mở 2 popup.
  const { connect, connectors, isPending } = useConnect();
  // ❓ Connector "mock" là gì?
  // → Ví giả do wagmi cung cấp, dùng sẵn tài khoản anvil #0 (có 10.000 AVAX) — không cần cài MetaMask khi dev local.
  //   Chỉ được thêm khi isLocal (xem lib/wagmi.ts); trên Fuji find() trả undefined nên nút "Dev wallet" không hiện.
  const devWallet = connectors.find((c) => c.id === "mock");
  const wc = connectors.find((c) => c.id === "walletConnect");
  // ❓ Tại sao tìm connector có type "injected" nhưng id KHÁC "injected" trước?
  // → Ví cài trong browser (Core, MetaMask…) tự "announce" qua EIP-6963 và wagmi tạo cho mỗi ví một connector riêng
  //   (id kiểu "app.core.extension"). Ưu tiên connector đó để mở đúng ví; fallback về connector "injected" chung
  //   (đọc window.ethereum) cho ví cũ không hỗ trợ EIP-6963.
  const injected =
    connectors.find((c) => c.type === "injected" && c.id !== "injected") ??
    connectors.find((c) => c.id === "injected");
  // ❓ Đã có connector injected, sao còn cần useHasInjected?
  // → wagmi LUÔN tạo connector "injected" kể cả khi browser không cài ví nào. useHasInjected kiểm tra thực tế
  //   (window.ethereum hoặc event EIP-6963) để quyết định có nên hiện nút "Connect wallet" hay không.
  const hasInjected = useHasInjected();
  const mobile = useIsMobile();
  return { connect, isPending, devWallet, wc, injected, hasInjected, mobile };
}

export function ConnectButtons({ size = "md" }: { size?: Size }) {
  const { connect, isPending, devWallet, wc, injected, hasInjected, mobile } =
    useWalletOptions();

  // ❓ Nút nào là nút chính?
  // → Có ví cài sẵn trong browser → "Connect wallet" (injected) là nút chính; nếu không, WalletConnect hoặc Dev wallet
  //   lên thay. Cần cả hai: ví thật được phát hiện VÀ wagmi có connector tương ứng, thiếu một là bấm sẽ không mở gì.
  const primaryIsInjected = hasInjected && !!injected;

  return (
    <>
      {devWallet && (
        <Button
          variant={primaryIsInjected || wc ? "outline" : "primary"}
          size={size}
          arrow={size === "lg" && !primaryIsInjected && !wc}
          disabled={isPending}
          onClick={() => connect({ connector: devWallet })}
        >
          Dev wallet (anvil)
        </Button>
      )}
      {primaryIsInjected && (
        <Button
          variant="primary"
          size={size}
          disabled={isPending}
          onClick={() => connect({ connector: injected! })}
        >
          {isPending ? "Connecting…" : "Connect wallet"}
        </Button>
      )}
      {wc && (
        <Button
          variant={primaryIsInjected ? "secondary" : "primary"}
          size={size}
          disabled={isPending}
          onClick={() => connect({ connector: wc })}
        >
          {mobile ? "Core / MetaMask" : "Scan QR with Core mobile"}
        </Button>
      )}
      {!primaryIsInjected && !wc && !devWallet && !mobile && (
        <a
          className="inline-flex h-10 items-center gap-1.5 border border-line-strong px-4 text-[13px] font-semibold text-fg transition-colors hover:bg-hover"
          href="https://core.app"
          target="_blank"
          rel="noreferrer"
        >
          Install Core Wallet
          <Icon name="external" />
        </a>
      )}
    </>
  );
}

export function MobileConnectHelp() {
  const { hasInjected, mobile, wc } = useWalletOptions();
  const [copied, setCopied] = useState(false);

  // ❓ Khi nào hiện hướng dẫn "Mint on your phone"?
  // → Chỉ trên mobile và khi KHÔNG có ví injected — tức đang mở bằng Safari/Chrome thường. Nếu trang đang chạy trong
  //   browser của app Core/MetaMask thì window.ethereum đã có → kết nối như desktop, không cần hướng dẫn.
  if (!mobile || hasInjected) return null;

  async function copy() {
    try {
      // ❓ Vì sao phải copy link thay vì mở thẳng app Core?
      // → Dán link vào tab Browser của app Core thì trang chạy ngay trong ví → window.ethereum có sẵn. clipboard.writeText
      //   chỉ hoạt động trên HTTPS và sau thao tác người dùng, nên bọc try/catch để không crash nếu bị chặn.
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="border-t border-line bg-surface-solid">
      <div className="mx-auto w-full max-w-7xl px-5 py-4 md:px-6">
        <p className="eyebrow mb-3 text-muted">Mint on your phone</p>
        <ol className="space-y-3 text-[13px] leading-relaxed text-fg">
          {wc && (
            <li className="flex gap-3">
              <span className="font-mono text-[11px] tracking-[0.18em] text-avax">01</span>
              <span>
                Tap <b>Core / MetaMask</b> above and pick your wallet — the wallet app opens
                so you can approve the connection (WalletConnect).
              </span>
            </li>
          )}
          <li className="flex gap-3">
            <span className="font-mono text-[11px] tracking-[0.18em] text-avax">
              {wc ? "02" : "01"}
            </span>
            <span className="min-w-0">
              {wc ? "Or open" : "Open"} this page <b>inside the Core app</b>: Core →{" "}
              <b>Browser</b> tab → paste the link into the address bar.{" "}
              <button
                type="button"
                onClick={copy}
                className="inline-flex cursor-pointer items-center gap-1 border border-line-strong px-2 py-0.5 font-mono text-[11px] tracking-wide text-fg transition-colors hover:bg-hover"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] tracking-[0.18em] text-avax">
              {wc ? "03" : "02"}
            </span>
            <span>
              Using MetaMask?{" "}
              <a
                className="inline-flex items-center gap-1 underline hover:text-avax"
                href={metamaskDeepLink()}
                rel="noreferrer"
              >
                Open in MetaMask <Icon name="external" className="size-3" />
              </a>
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
