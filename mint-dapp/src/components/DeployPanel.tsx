"use client";

import {
  useAccount,
  useDeployContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  AVAXCATS_BYTECODE,
  BYTECODE_SIZE,
  CONTRACT_FILE,
  CONTRACT_SOURCE,
  FUNCTION_COUNT,
  SOLC_VERSION,
} from "@/lib/artifact";
import { activeChain, CHAIN_LABEL, FAUCET, isLocal } from "@/lib/chains";
import { AVAXCATS_ABI, explorerAddress, explorerTx } from "@/lib/contract";
import { clearDeployedAddress, setDeployedAddress } from "@/lib/deployed";
import { ConnectButtons } from "./ConnectButtons";
import { Button, Card, Chapter, Eyebrow, Icon, Mono, PulseDot, Status } from "./ui";

function Source({ source }: { source: string }) {
  const lines = source.replace(/\n+$/, "").split("\n");
  return (
    <div className="max-h-[420px] overflow-auto border-y border-line bg-bg">
      <table className="w-full border-collapse font-mono text-[12.5px] leading-[1.65]">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="hover:bg-hover">
              <td className="w-10 border-r border-line px-2 text-right align-top text-muted/60 select-none">
                {i + 1}
              </td>
              <td className="px-4 whitespace-pre text-fg/80">{line || " "}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Props = {
  current?: string;
  onGoMint: () => void;
};

export function DeployPanel({ current, onGoMint }: Props) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { deployContract, data: hash, isPending, error, reset } = useDeployContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({
    hash,
    chainId: activeChain.id,
  });

  const wrongChain = isConnected && chainId !== activeChain.id;
  const deployed = receipt?.contractAddress;
  const busy = isPending || confirming;
  const txLink = hash ? explorerTx(hash) : null;

  return (
    <section className="anim-rise">
      <Chapter
        n="01"
        label="Contract"
        title="Contract của bạn"
        desc={`Toàn bộ contract ERC-721 của AvaxCats. Bấm Deploy là nó lên ${CHAIN_LABEL} bằng ví của bạn — không cần Remix, không cần cài gì.`}
      />

      {current && !deployed && (
        <Card className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
          <Eyebrow dot={<PulseDot color="bg-emerald-500" />} className="text-fg">
            Đang dùng
          </Eyebrow>
          <Mono className="text-fg select-all">{current}</Mono>
          {explorerAddress(current) && (
            <a
              className="eyebrow inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg"
              href={explorerAddress(current)!}
              target="_blank"
              rel="noreferrer"
            >
              Snowtrace
              <Icon name="external" className="size-3" />
            </a>
          )}
          <div className="grow" />
          <Button variant="primary" onClick={onGoMint} arrow>
            Sang bước mint
          </Button>
          <Button variant="ghost" onClick={clearDeployedAddress}>
            Quên contract này
          </Button>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
          <span className="font-mono text-[12px] text-fg">{CONTRACT_FILE}</span>
          <Eyebrow>solc {SOLC_VERSION}</Eyebrow>
          <Eyebrow>{BYTECODE_SIZE.toLocaleString()} bytes</Eyebrow>
          <Eyebrow>{FUNCTION_COUNT} hàm public</Eyebrow>
          <div className="grow" />
          <Eyebrow dot={<PulseDot color="bg-emerald-500" ping={false} />} className="text-emerald-600 dark:text-emerald-400">
            Đã compile
          </Eyebrow>
        </div>

        <Source source={CONTRACT_SOURCE} />

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            {!isConnected ? (
              <ConnectButtons size="lg" />
            ) : wrongChain ? (
              <Button
                variant="primary"
                size="lg"
                disabled={switching}
                onClick={() => switchChain({ chainId: activeChain.id })}
              >
                {switching ? "Đang chuyển" : "Chuyển mạng"}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                disabled={busy}
                className={busy ? "anim-sweep" : ""}
                onClick={() =>
                  deployContract({
                    abi: AVAXCATS_ABI,
                    bytecode: AVAXCATS_BYTECODE,
                    chainId: activeChain.id,
                  })
                }
              >
                {busy ? "Đang deploy" : current ? "Deploy contract mới" : "Deploy contract"}
              </Button>
            )}

            {deployed && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setDeployedAddress(deployed);
                  onGoMint();
                }}
              >
                Sang bước mint
              </Button>
            )}
            {error && <Button onClick={() => reset()}>Thử lại</Button>}
          </div>

          <div className="mt-4 space-y-1.5">
            {isPending && <Status tone="busy">Xác nhận giao dịch trong ví</Status>}
            {hash && confirming && (
              <Status tone="busy">
                Chờ block xác nhận{" "}
                {txLink ? (
                  <a className="underline hover:text-fg" href={txLink} target="_blank" rel="noreferrer">
                    xem tx
                  </a>
                ) : (
                  <Mono className="text-muted">
                    {hash.slice(0, 10)}…{hash.slice(-8)}
                  </Mono>
                )}
              </Status>
            )}
            {deployed && (
              <Status tone="ok">
                <span className="block">Contract đã lên {CHAIN_LABEL}. Lưu địa chỉ này lại:</span>
                <Mono className="mt-0.5 block text-fg select-all">{deployed}</Mono>
              </Status>
            )}
            {error && (
              <Status tone="err">
                Deploy thất bại:{" "}
                {/insufficient funds/i.test(error.message)
                  ? isLocal
                    ? "ví không có AVAX trên anvil — dùng ví dev, hoặc `npm run fund <địa chỉ ví>`."
                    : "ví không đủ AVAX test để trả gas."
                  : /user rejected|denied/i.test(error.message)
                    ? "bạn đã từ chối giao dịch trong ví."
                    : ((error as { shortMessage?: string }).shortMessage ?? error.message).slice(0, 180)}
              </Status>
            )}
            {!isConnected && (
              <Status tone="warn">
                Kết nối ví để deploy. Trên điện thoại: dùng WalletConnect hoặc mở trang
                trong trình duyệt của app Core (hướng dẫn ở thanh trạng thái phía trên).
              </Status>
            )}
          </div>

          {!isLocal && (
            <p className="mt-4 text-xs leading-5 text-muted">
              Deploy tốn khoảng 1,25 triệu gas.{" "}
              <a className="underline hover:text-fg" href={FAUCET} target="_blank" rel="noreferrer">
                Xin AVAX test ở faucet
              </a>
            </p>
          )}
        </div>
      </Card>
    </section>
  );
}
