"use client";

import { useSyncExternalStore } from "react";
import { formatEther } from "viem";
import {
  useAccount,
  useBalance,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { activeChain, CHAIN_LABEL, FAUCET, isLocal } from "@/lib/chains";
import { ConnectButtons, MobileConnectHelp } from "./ConnectButtons";
import { SupplyBadge } from "./SupplyBadge";
import { Button, Icon, PulseDot, Stat } from "./ui";

export function WalletBar() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: balance } = useBalance({ address, chainId: activeChain.id });

  const wrongChain = isConnected && chainId !== activeChain.id;
  const empty = balance?.value === 0n;
  const online = mounted && isConnected;

  return (
    <section className="border-y border-line" aria-label="Trạng thái ví">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-px bg-line lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
        <Stat
          label="Mạng"
          wrap
          dot={
            <PulseDot
              color={!online ? "bg-zinc-400" : wrongChain ? "bg-amber-500" : "bg-avax"}
              ping={online && !wrongChain}
            />
          }
          valueClassName={
            wrongChain ? "text-amber-600 dark:text-amber-400 text-[13px] md:text-base" : "text-[13px] md:text-base"
          }
          value={
            !mounted
              ? "…"
              : wrongChain
                ? `Sai mạng — cần ${CHAIN_LABEL}`
                : CHAIN_LABEL
          }
        />
        <Stat
          label="Ví"
          value={
            online && address ? (
              `${address.slice(0, 6)}…${address.slice(-4)}`
            ) : (
              <span className="text-muted">Chưa kết nối</span>
            )
          }
        />
        <Stat
          label="Số dư"
          value={
            online && balance ? (
              <>
                {Number(formatEther(balance.value)).toFixed(3)}
                <span className="text-muted"> AVAX</span>
              </>
            ) : (
              <span className="text-muted">—</span>
            )
          }
        />
        <SupplyBadge />

        <div className="col-span-2 flex flex-wrap items-center gap-2 bg-surface-solid px-5 py-4 md:px-6 lg:col-span-1 lg:justify-end">
          {!mounted ? null : wrongChain ? (
            <Button
              variant="primary"
              disabled={switching}
              onClick={() => switchChain({ chainId: activeChain.id })}
            >
              {switching ? "Đang chuyển" : "Chuyển mạng"}
            </Button>
          ) : isConnected ? (
            <Button variant="ghost" onClick={() => disconnect()}>
              Ngắt kết nối
            </Button>
          ) : (
            <ConnectButtons />
          )}
        </div>
      </div>

      {mounted && !isConnected && <MobileConnectHelp />}

      {online && empty && (
        <div className="border-t border-line bg-amber-500/10">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-5 py-2.5 text-[12.5px] text-amber-700 md:px-6 dark:text-amber-400">
            <Icon name="alert" />
            {isLocal ? (
              <span>
                Ví này chưa có AVAX trên anvil. Dùng <b>Ví dev (anvil)</b>, hoặc chạy{" "}
                <code className="border border-amber-500/30 px-1.5 py-0.5 font-mono text-[12px] break-all">
                  npm run fund {address}
                </code>
              </span>
            ) : (
              <a
                className="inline-flex items-center gap-1.5 hover:underline"
                href={FAUCET}
                target="_blank"
                rel="noreferrer"
              >
                Ví chưa có AVAX test — xin ở faucet
                <Icon name="external" />
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
