"use client";

import { useState } from "react";
import { useConnect } from "wagmi";
import { currentUrl, metamaskDeepLink, useHasInjected, useIsMobile } from "@/lib/wallet";
import { Button, Icon } from "./ui";

type Size = "md" | "lg";

export function useWalletOptions() {
  const { connect, connectors, isPending } = useConnect();
  const devWallet = connectors.find((c) => c.id === "mock");
  const wc = connectors.find((c) => c.id === "walletConnect");
  const injected =
    connectors.find((c) => c.type === "injected" && c.id !== "injected") ??
    connectors.find((c) => c.id === "injected");
  const hasInjected = useHasInjected();
  const mobile = useIsMobile();
  return { connect, isPending, devWallet, wc, injected, hasInjected, mobile };
}

export function ConnectButtons({ size = "md" }: { size?: Size }) {
  const { connect, isPending, devWallet, wc, injected, hasInjected, mobile } =
    useWalletOptions();

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
          Ví dev (anvil)
        </Button>
      )}
      {primaryIsInjected && (
        <Button
          variant="primary"
          size={size}
          disabled={isPending}
          onClick={() => connect({ connector: injected! })}
        >
          {isPending ? "Đang kết nối" : "Kết nối ví"}
        </Button>
      )}
      {wc && (
        <Button
          variant={primaryIsInjected ? "secondary" : "primary"}
          size={size}
          disabled={isPending}
          onClick={() => connect({ connector: wc })}
        >
          {mobile ? "Core / MetaMask" : "Quét QR bằng Core mobile"}
        </Button>
      )}
      {!primaryIsInjected && !wc && !devWallet && !mobile && (
        <a
          className="inline-flex h-10 items-center gap-1.5 border border-line-strong px-4 text-[13px] font-semibold text-fg transition-colors hover:bg-hover"
          href="https://core.app"
          target="_blank"
          rel="noreferrer"
        >
          Cài Core Wallet
          <Icon name="external" />
        </a>
      )}
    </>
  );
}

export function MobileConnectHelp() {
  const { hasInjected, mobile, wc } = useWalletOptions();
  const [copied, setCopied] = useState(false);

  if (!mobile || hasInjected) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="border-t border-line bg-surface-solid">
      <div className="mx-auto w-full max-w-7xl px-5 py-4 md:px-6">
        <p className="eyebrow mb-3 text-muted">Mint trên điện thoại</p>
        <ol className="space-y-3 text-[13px] leading-relaxed text-fg">
          {wc && (
            <li className="flex gap-3">
              <span className="font-mono text-[11px] tracking-[0.18em] text-avax">01</span>
              <span>
                Bấm <b>Core / MetaMask</b> ở trên, chọn ví trong danh sách — app ví sẽ tự
                mở để bạn duyệt kết nối (WalletConnect).
              </span>
            </li>
          )}
          <li className="flex gap-3">
            <span className="font-mono text-[11px] tracking-[0.18em] text-avax">
              {wc ? "02" : "01"}
            </span>
            <span className="min-w-0">
              {wc ? "Hoặc mở" : "Mở"} trang này <b>bên trong app Core</b>: Core → tab{" "}
              <b>Browser</b> → dán link vào ô địa chỉ.{" "}
              <button
                type="button"
                onClick={copy}
                className="inline-flex cursor-pointer items-center gap-1 border border-line-strong px-2 py-0.5 font-mono text-[11px] tracking-wide text-fg transition-colors hover:bg-hover"
              >
                {copied ? "Đã sao chép" : "Sao chép link"}
              </button>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] tracking-[0.18em] text-avax">
              {wc ? "03" : "02"}
            </span>
            <span>
              Dùng MetaMask?{" "}
              <a
                className="inline-flex items-center gap-1 underline hover:text-avax"
                href={metamaskDeepLink()}
                rel="noreferrer"
              >
                Mở trong MetaMask <Icon name="external" className="size-3" />
              </a>
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
