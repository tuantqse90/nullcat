"use client";

import { useEffect, useMemo, useState } from "react";
import { parseEventLogs } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { Cat } from "@/lib/cats";
import { activeChain, isLocal } from "@/lib/chains";
import { AVAXCATS_ABI, explorerNft, explorerTx } from "@/lib/contract";
import { useContractAddress } from "@/lib/deployed";
import { buildTokenURI } from "@/lib/metadata";
import { Button, Icon, Mono, Pillar, Status } from "./ui";

// ❓ Vì sao phải "dịch" lỗi thay vì hiện error.message?
// → error.message của viem rất dài (kèm request body, link docs). Ta gộp shortMessage (1 dòng tóm tắt) với message rồi
//   dò vài mẫu quen thuộc để trả về câu ngắn, dễ hiểu; không khớp mẫu nào thì cắt còn 180 ký tự.
function explainError(error: Error): string {
  const raw = `${(error as { shortMessage?: string }).shortMessage ?? ""} ${error.message}`;

  if (/insufficient funds/i.test(raw)) {
    return isLocal
      ? "wallet has no AVAX on anvil. Use the dev wallet, or run `npm run fund <wallet address>`."
      : "wallet doesn't have enough test AVAX for gas — top up at the faucet and try again.";
  }
  // ❓ "CatAlreadyMinted" từ đâu ra?
  // → Là tên custom error trong contract (`revert CatAlreadyMinted(catId)`). Khi ước lượng gas hoặc gửi tx, node trả
  //   revert data và tên lỗi xuất hiện trong message → match bằng regex. Xảy ra khi 2 người chọn cùng một con và người
  //   kia mint trước; UI chỉ biết sau POLL_MS nên vẫn phải phòng ở đây.
  if (/CatAlreadyMinted/i.test(raw))
    return "someone just minted this one — pick another cat.";
  if (/CatDoesNotExist/i.test(raw)) return "invalid catId.";
  // ❓ Từ chối trong ví có phải lỗi on-chain không?
  // → Không — ví trả lỗi 4001 (User rejected) trước khi gửi gì lên mạng, không tốn gas. Bắt riêng để không dọa người dùng.
  if (/User rejected|denied transaction/i.test(raw))
    return "you rejected the transaction in your wallet.";

  const short = (error as { shortMessage?: string }).shortMessage ?? error.message;
  return short.length > 180 ? short.slice(0, 180) + "…" : short;
}

function Attrs({ cat, className = "" }: { cat: Cat; className?: string }) {
  return (
    <dl className={`grid gap-x-4 gap-y-2 ${className}`}>
      {cat.attributes.map((a) => (
        <div key={a.trait_type} className="min-w-0">
          <dt className="eyebrow text-steel/70">{a.trait_type}</dt>
          <dd className="truncate text-[13px] text-white/90">{a.value}</dd>
        </div>
      ))}
    </dl>
  );
}

type Props = {
  cat: Cat;
  catId: number;
  taken: boolean;
  onRandom: () => void;
  onMinted: () => void;
  onMintStart: () => void;
  onRegister: () => void;
};

export function MintPanel({
  cat,
  catId,
  taken,
  onRandom,
  onMinted,
  onMintStart,
  onRegister,
}: Props) {
  const { isConnected, chainId } = useAccount();
  const { address: contract, isConfigured } = useContractAddress();
  // ❓ useWriteContract khác useReadContract chỗ nào?
  // → Read = eth_call, miễn phí. Write = transaction thay đổi state → phải ký bằng ví và trả gas. writeContract() mở ví;
  //   data (hash) có ngay sau khi ví gửi; isPending = đang chờ ký; error = ví từ chối hoặc revert khi ước lượng gas;
  //   reset() xoá toàn bộ để mint con khác.
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  // ❓ Tại sao còn phải đợi receipt sau khi có hash?
  // → Hash chỉ nghĩa là tx đã được gửi. receipt về khi tx nằm trong block: có status "success"/"reverted" và logs
  //   (chứa event Minted → tokenId). Không đợi receipt thì không biết mint thành công hay không.
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({
    hash,
    chainId: activeChain.id,
  });

  const [pendingName, setPendingName] = useState<string | null>(null);

  // ❓ Sao lại reset khi đổi cat?
  // → hash/receipt/error là của lần mint TRƯỚC. Không xoá thì chọn cat mới vẫn thấy "Minted · token #N" hoặc lỗi cũ,
  //   và nút Mint kẹt ở busy. reset() của wagmi có tham chiếu ổn định nên đưa vào deps không gây chạy lại vô ích.
  useEffect(() => {
    reset();
  }, [cat, reset]);

  // ❓ Lấy tokenId của NFT vừa mint bằng cách nào?
  // → Hàm mint() có `return tokenId` nhưng giá trị return của một transaction KHÔNG được lưu on-chain. Cách duy nhất là
  //   đọc event Minted(to, tokenId, catId) trong receipt.logs: parseEventLogs dùng ABI để lọc đúng topic và giải mã args.
  //   useMemo để không parse lại mỗi lần render; logs[0] vì mỗi tx mint chỉ phát đúng 1 event Minted.
  const tokenId = useMemo(() => {
    if (!receipt) return undefined;
    const logs = parseEventLogs({
      abi: AVAXCATS_ABI,
      logs: receipt.logs,
      eventName: "Minted",
    });
    return logs[0]?.args.tokenId;
  }, [receipt]);

  // ❓ onMinted được gọi để làm gì?
  // → Báo cho page refetch mintedBitmap ngay (thay vì đợi POLL_MS) để cat vừa mint bị khoá xám trong CatGrid lập tức.
  //   Đặt trong useEffect vì gọi callback của cha (có setState) ngay trong lúc render là anti-pattern và React sẽ cảnh báo.
  useEffect(() => {
    if (receipt) onMinted();
  }, [receipt, onMinted]);

  const wrongChain = isConnected && chainId !== activeChain.id;
  const busy = isPending || confirming;
  // ❓ Có receipt là thành công chưa?
  // → Chưa chắc: tx được mine nhưng có thể revert (status "reverted") và vẫn tốn gas. Chỉ status === "success" mới
  //   được coi là đã mint và hiện link NFT.
  const success = receipt?.status === "success";
  // ❓ Khi nào được phép bấm Mint?
  // → Đủ 5 điều kiện: đã có địa chỉ contract, ví đã kết nối, đúng mạng, cat này chưa ai mint (taken = false) và không
  //   có tx đang chạy. Thiếu một là tx sẽ fail (revert hoặc ví từ chối) → chặn từ UI để khỏi tốn gas vô ích.
  const readyToMint = isConfigured && isConnected && !wrongChain && !taken && !busy;

  function mint() {
    // ❓ Vì sao lưu tên cat vào state riêng?
    // → Nếu người dùng bấm Random trong lúc chờ receipt, prop `cat` đổi nhưng thông báo thành công vẫn phải hiện đúng
    //   con vừa mint.
    setPendingName(cat.name);
    onMintStart();
    // ❓ args của mint là gì?
    // → Khớp chữ ký Solidity `mint(uint256 catId, string uri)`: catId phải là BigInt (uint256), uri là tokenURI dạng
    //   data:application/json;base64 chứa name/image/attributes — metadata nằm hoàn toàn on-chain, không cần IPFS.
    //   chainId ép wagmi gửi trên đúng mạng; ví ở mạng khác sẽ bị từ chối thay vì mint nhầm chain.
    writeContract({
      abi: AVAXCATS_ABI,
      address: contract,
      functionName: "mint",
      args: [BigInt(catId), buildTokenURI(cat)],
      chainId: activeChain.id,
    });
  }

  const txLink = hash ? explorerTx(hash) : null;
  const nftLink = tokenId !== undefined ? explorerNft(contract, tokenId) : null;
  const shortHash = hash ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : "";

  const barStatus = busy
    ? { text: isLocal ? "Sending transaction…" : "Confirm in your wallet…", cls: "text-muted" }
    : success && tokenId !== undefined
      ? { text: `Minted · token #${tokenId.toString()}`, cls: "text-emerald-600 dark:text-emerald-400" }
      : error
        ? { text: "Mint failed — see details below", cls: "text-avax" }
        : taken
          ? { text: "Already minted — pick another cat", cls: "text-amber-600 dark:text-amber-400" }
          : !isConnected
            ? { text: "Connect a wallet to mint", cls: "text-amber-600 dark:text-amber-400" }
            : wrongChain
              ? { text: "Wrong network — switch first", cls: "text-amber-600 dark:text-amber-400" }
              : { text: `${cat.attributes.length} traits · ready to mint`, cls: "text-muted" };

  return (
    <>
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface backdrop-blur-sm sm:hidden">
        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="px size-11 shrink-0 border border-line bg-surface-solid"
            src={cat.image}
            alt=""
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-fg">{cat.name}</div>
            <div className={`truncate text-[11px] ${barStatus.cls}`}>{barStatus.text}</div>
          </div>
          <Button
            variant="primary"
            onClick={mint}
            disabled={!readyToMint}
            className={busy ? "anim-sweep" : ""}
          >
            {busy ? "Minting…" : taken ? "Minted" : "Mint"}
          </Button>
        </div>
      </div>

      <Pillar className="mt-6">
        <div className="flex flex-col gap-6 p-5 md:flex-row md:items-start md:gap-8 md:p-7">
          <div className="flex items-center justify-between md:w-8 md:flex-col md:items-start md:justify-start md:gap-4">
            <span className="font-mono text-[11px] tracking-[0.18em] text-steel">02</span>
            <span className="eyebrow text-steel/80 md:hidden">Selected cat</span>
            <span className="hidden rotate-180 font-mono text-[10px] tracking-[0.18em] text-steel/80 [writing-mode:vertical-rl] md:block">
              SELECTED CAT
            </span>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={cat.name}
            className="px anim-settle size-36 shrink-0 self-start rounded-lg border border-white/10 bg-black/30 md:size-44"
            src={cat.image}
            alt={cat.name}
          />

          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-light tracking-[-0.02em] md:text-3xl">{cat.name}</h3>
            <Attrs cat={cat} className="mt-4 hidden grid-cols-2 sm:grid sm:grid-cols-3 sm:gap-x-6" />
            <details className="group mt-4 sm:hidden">
              <summary className="eyebrow flex cursor-pointer list-none items-center gap-2 py-1 text-steel">
                {cat.attributes.length} traits
                <Icon name="arrow" className="size-3 transition-transform group-open:rotate-90" />
              </summary>
              <Attrs cat={cat} className="mt-3 grid-cols-2" />
            </details>

            <div className="mt-5 space-y-1.5">
              {isPending && (
                <Status tone="busy" dark>
                  {isLocal ? "Sending transaction" : "Confirm the transaction in your wallet"}
                </Status>
              )}
              {hash && confirming && (
                <Status tone="busy" dark>
                  Waiting for confirmation{" "}
                  {txLink ? (
                    <a className="underline hover:text-white" href={txLink} target="_blank" rel="noreferrer">
                      view tx
                    </a>
                  ) : (
                    <Mono className="text-steel">{shortHash}</Mono>
                  )}
                </Status>
              )}
              {success && tokenId !== undefined && (
                <Status tone="ok" dark>
                  {pendingName ?? cat.name} is token #{tokenId.toString()}
                  {txLink && nftLink ? (
                    <>
                      {" · "}
                      <a className="underline hover:text-white" href={txLink} target="_blank" rel="noreferrer">
                        tx
                      </a>
                      {" · "}
                      <a className="underline hover:text-white" href={nftLink} target="_blank" rel="noreferrer">
                        NFT
                      </a>
                    </>
                  ) : (
                    <>
                      {" · "}
                      <Mono className="text-steel">{shortHash}</Mono>
                    </>
                  )}
                </Status>
              )}
              {error && (
                <Status tone="err" dark>
                  Mint failed: {explainError(error)}
                </Status>
              )}
              {taken && !hash && (
                <Status tone="warn" dark>
                  {cat.name} is already minted — one mint per cat. Pick another.
                </Status>
              )}
              {!isConnected && (
                <Status tone="warn" dark>
                  {isLocal
                    ? "Use the Dev wallet (anvil) button above to mint."
                    : "Connect a wallet to mint."}
                </Status>
              )}
              {wrongChain && (
                <Status tone="warn" dark>
                  Switch to the right network first.
                </Status>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 md:w-[220px]">
            <Button
              variant="primary"
              size="lg"
              onClick={mint}
              disabled={!readyToMint}
              className={`sm:min-w-0 ${busy ? "anim-sweep" : ""}`}
            >
              {busy ? "Minting…" : taken ? "Already minted" : "Mint NFT"}
            </Button>
            <Button
              variant="inverse"
              size="lg"
              arrow={false}
              className="justify-center sm:min-w-0"
              onClick={onRandom}
            >
              Random
            </Button>
            {success && (
              <Button variant="frost" size="lg" className="sm:min-w-0" onClick={onRegister}>
                Register
              </Button>
            )}
          </div>
        </div>
      </Pillar>
    </>
  );
}
