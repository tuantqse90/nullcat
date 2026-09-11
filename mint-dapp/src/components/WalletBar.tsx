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
  // ❓ Vì sao cần biết component đã "mounted" chưa, và sao không dùng useState + useEffect?
  // → Next.js render trang này trên server trước (SSR); lúc đó không có ví nên isConnected luôn false. Hook này trả về
  //   false khi SSR (tham số thứ 3) và true trong browser, giúp HTML server và client khớp nhau → không bị lỗi
  //   hydration mismatch khi ví đã tự kết nối lại (reconnect) ngay lúc tải trang.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // ❓ useAccount cho ta biết gì?
  // → Hook của wagmi đọc trạng thái ví hiện tại: address, isConnected và chainId (mạng mà VÍ đang chọn — chưa chắc là
  //   mạng dApp muốn). Mọi ô trong thanh trạng thái này đều suy ra từ 3 giá trị đó.
  const { address, isConnected, chainId } = useAccount();
  // ❓ "Disconnect" có thật sự ngắt kết nối khỏi ví không?
  // → Không. disconnect() chỉ xoá kết nối phía dApp (wagmi quên connector và address). Quyền truy cập đã cấp trong
  //   MetaMask/Core vẫn còn; muốn thu hồi hẳn thì người dùng phải làm trong ví.
  const { disconnect } = useDisconnect();
  // ❓ switchChain làm gì, và isPending dùng để làm gì?
  // → switchChain gửi yêu cầu wallet_switchEthereumChain tới ví; ví hiện popup hỏi người dùng đồng ý (nếu chưa có mạng
  //   thì ví sẽ đề nghị thêm). isPending = true trong lúc chờ người dùng bấm → dùng để disable nút và hiện "Switching…".
  const { switchChain, isPending: switching } = useSwitchChain();
  // ❓ Tại sao truyền chainId: activeChain.id thay vì để wagmi lấy chain của ví?
  // → Ta muốn số dư trên đúng mạng của dApp (anvil/Fuji) kể cả khi ví đang ở mạng khác. Bỏ chainId đi, ví đang ở
  //   Ethereum mainnet thì ô Balance sẽ hiện ETH chứ không phải AVAX test — người dùng tưởng đủ tiền mà mint vẫn fail.
  const { data: balance } = useBalance({ address, chainId: activeChain.id });

  // ❓ Làm sao biết người dùng đang ở sai mạng?
  // → So sánh chainId của ví với chainId dApp cấu hình (activeChain). Chỉ tính là "sai" khi ĐÃ kết nối, vì lúc chưa
  //   kết nối chainId là undefined và luôn khác. Đây là điều kiện bật nút "Switch network" ở dưới.
  const wrongChain = isConnected && chainId !== activeChain.id;
  // ❓ Tại sao so sánh với 0n chứ không phải 0?
  // → balance.value là bigint (đơn vị wei, 18 chữ số thập phân) nên phải dùng literal bigint 0n; `=== 0` luôn false.
  //   Ví rỗng → hiện banner faucet bên dưới để người dùng xin AVAX test trước khi deploy/mint.
  const empty = balance?.value === 0n;
  // ❓ Vì sao không dùng thẳng isConnected?
  // → Ở lần render SSR và lần hydrate đầu tiên, mounted = false nên online = false dù ví đã kết nối. Nhờ vậy server và
  //   client render cùng một HTML; sau khi hydrate xong React render lại và mới hiện địa chỉ, số dư thật.
  const online = mounted && isConnected;

  return (
    <section className="border-y border-line" aria-label="Wallet status">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-px bg-line lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
        <Stat
          label="Network"
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
                ? `Wrong network — need ${CHAIN_LABEL}`
                : CHAIN_LABEL
          }
        />
        <Stat
          label="Wallet"
          value={
            online && address ? (
              `${address.slice(0, 6)}…${address.slice(-4)}`
            ) : (
              <span className="text-muted">Not connected</span>
            )
          }
        />
        <Stat
          label="Balance"
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
              {switching ? "Switching…" : "Switch network"}
            </Button>
          ) : isConnected ? (
            <Button variant="ghost" onClick={() => disconnect()}>
              Disconnect
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
                This wallet has no AVAX on anvil. Use <b>Dev wallet (anvil)</b>, or run{" "}
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
                No test AVAX yet — get some from the faucet
                <Icon name="external" />
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
