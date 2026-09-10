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
        title="Your contract"
        desc={`The full AvaxCats ERC-721 contract. Hit Deploy and it goes live on ${CHAIN_LABEL} from your wallet — no Remix, nothing to install.`}
      />

      {current && !deployed && (
        <Card className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
          <Eyebrow dot={<PulseDot color="bg-emerald-500" />} className="text-fg">
            In use
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
            Go to mint
          </Button>
          <Button variant="ghost" onClick={clearDeployedAddress}>
            Forget this contract
          </Button>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
          <span className="font-mono text-[12px] text-fg">{CONTRACT_FILE}</span>
          <Eyebrow>solc {SOLC_VERSION}</Eyebrow>
          <Eyebrow>{BYTECODE_SIZE.toLocaleString()} bytes</Eyebrow>
          <Eyebrow>{FUNCTION_COUNT} public functions</Eyebrow>
          <div className="grow" />
          <Eyebrow dot={<PulseDot color="bg-emerald-500" ping={false} />} className="text-emerald-600 dark:text-emerald-400">
            Compiled
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
                {switching ? "Switching…" : "Switch network"}
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
                {busy ? "Deploying…" : current ? "Deploy a new contract" : "Deploy contract"}
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
                Go to mint
              </Button>
            )}
            {error && <Button onClick={() => reset()}>Retry</Button>}
          </div>

          <div className="mt-4 space-y-1.5">
            {isPending && <Status tone="busy">Confirm the transaction in your wallet</Status>}
            {hash && confirming && (
              <Status tone="busy">
                Waiting for confirmation{" "}
                {txLink ? (
                  <a className="underline hover:text-fg" href={txLink} target="_blank" rel="noreferrer">
                    view tx
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
                <span className="block">Contract is live on {CHAIN_LABEL}. Save this address:</span>
                <Mono className="mt-0.5 block text-fg select-all">{deployed}</Mono>
              </Status>
            )}
            {error && (
              <Status tone="err">
                Deploy failed:{" "}
                {/insufficient funds/i.test(error.message)
                  ? isLocal
                    ? "wallet has no AVAX on anvil — use the dev wallet, or `npm run fund <wallet address>`."
                    : "wallet doesn't have enough test AVAX for gas."
                  : /user rejected|denied/i.test(error.message)
                    ? "you rejected the transaction in your wallet."
                    : ((error as { shortMessage?: string }).shortMessage ?? error.message).slice(0, 180)}
              </Status>
            )}
            {!isConnected && (
              <Status tone="warn">
                Connect a wallet to deploy. On a phone: use WalletConnect or open this page in
                the Core app&apos;s browser (see the status bar above).
              </Status>
            )}
          </div>

          {!isLocal && (
            <p className="mt-4 text-xs leading-5 text-muted">
              Deploying costs about 1.25M gas.{" "}
              <a className="underline hover:text-fg" href={FAUCET} target="_blank" rel="noreferrer">
                Get test AVAX from the faucet
              </a>
            </p>
          )}
        </div>
      </Card>
    </section>
  );
}
