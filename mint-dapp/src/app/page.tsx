"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CatGrid } from "@/components/CatGrid";
import { DeployPanel } from "@/components/DeployPanel";
import { Footer } from "@/components/Footer";
import { MintPanel } from "@/components/MintPanel";
import { MyCats } from "@/components/MyCats";
import { RegisterPanel } from "@/components/RegisterPanel";
import { Stepper } from "@/components/Stepper";
import { WalletBar } from "@/components/WalletBar";
import { Button, Chapter, Eyebrow, PulseDot } from "@/components/ui";
import { CATS } from "@/lib/cats";
import { CHAIN_LABEL } from "@/lib/chains";
import { useContractAddress } from "@/lib/deployed";
import { BUILDER_HUB } from "@/lib/links";
import { useMintedCats } from "@/lib/minted";

function CatMarquee() {
  const strip = [...CATS, ...CATS];
  return (
    <div className="relative overflow-hidden border-y border-line bg-surface-solid">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-surface-solid to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-surface-solid to-transparent" />
      <div className="anim-marquee flex w-max gap-px py-3">
        {strip.map((cat, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${cat.name}-${i}`}
            className="px size-12 shrink-0 md:size-14"
            src={cat.image}
            alt=""
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { address: contract, isConfigured } = useContractAddress();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const onContractStep = !isConfigured || step === 1;
  const { taken, available, mintedCount, refetch } = useMintedCats();
  const [selected, setSelected] = useState(0);
  const [rolling, setRolling] = useState(false);

  const [justMinted, setJustMinted] = useState<number | null>(null);
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickRandom = useCallback(() => {
    if (available.length === 0) return;
    const draw = () =>
      setSelected(available[Math.floor(Math.random() * available.length)]!);
    if (rollTimer.current) clearInterval(rollTimer.current);
    setJustMinted(null);
    setRolling(true);
    draw();
    let n = 1;
    rollTimer.current = setInterval(() => {
      draw();
      if (++n >= 6) {
        if (rollTimer.current) clearInterval(rollTimer.current);
        rollTimer.current = null;
        setRolling(false);
      }
    }, 70);
  }, [available]);

  useEffect(
    () => () => {
      if (rollTimer.current) clearInterval(rollTimer.current);
    },
    [],
  );

  const [touched, setTouched] = useState(false);

  const handleMinted = useCallback(() => {
    setJustMinted(selected);
    refetch();
  }, [selected, refetch]);

  const choose = (i: number) => {
    setTouched(true);
    setJustMinted(null);
    setSelected(i);
  };

  const effective =
    touched || selected === justMinted || !taken[selected] || available.length === 0
      ? selected
      : available[0]!;

  const go = (n: 1 | 2 | 3) => {
    setStep(n);
    document.getElementById("content")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <main className="min-w-0 flex-1 overflow-x-clip">
        <section className="relative overflow-hidden">
          <div className="hero-dots pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-5 pt-20 pb-16 text-center md:px-6 md:pt-28 md:pb-24">
            <Eyebrow className="anim-rise max-w-full flex-wrap justify-center text-center" dot={<PulseDot />}>
              Team Avalanche · Team1 VN · {CHAIN_LABEL}
            </Eyebrow>
            <h1 className="display anim-rise-2 mt-6 text-[2.25rem] text-fg sm:text-[3.25rem] md:text-[4.5rem] xl:text-[5.5rem]">
              Mint mèo
              <br />
              lên Avalanche
              <span className="text-avax motion-safe:animate-[pulse_3s_ease-in-out_infinite]">.</span>
            </h1>
            <p className="anim-rise-3 mt-8 max-w-xl text-sm leading-relaxed text-muted md:text-base">
              48 con mèo pixel sinh từ generator{" "}
              <code className="font-mono text-[13px] text-fg">nullcat</code>. Deploy
              contract ERC-721 bằng ví của bạn, chọn một con, mint, rồi đăng ký với ban
              tổ chức.
            </p>
            <div className="anim-rise-3 mt-10 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:gap-6">
              {isConfigured ? (
                <Button variant="primary" size="lg" onClick={() => go(2)}>
                  Vào màn hình mint
                </Button>
              ) : (
                <Button variant="primary" size="lg" onClick={() => go(1)}>
                  Deploy contract
                </Button>
              )}
              <Button variant="secondary" size="lg" onClick={() => go(1)}>
                Xem contract
              </Button>
            </div>
            <a
              className="anim-rise-3 mt-8 font-mono text-[11px] tracking-[0.18em] text-muted transition-colors hover:text-fg"
              href={BUILDER_HUB}
              target="_blank"
              rel="noreferrer"
            >
              XEM AVALANCHE BUILDER HUB →
            </a>
          </div>
          <CatMarquee />
        </section>

        <WalletBar />

        <section
          id="content"
          className="mx-auto w-full max-w-7xl scroll-mt-14 px-5 py-12 md:px-6 md:py-16"
        >
          {isConfigured && (
            <div className="mb-10">
              <Stepper
                current={onContractStep ? 1 : step}
                done={mintedCount > 0 ? 2 : 1}
                onGo={setStep}
              />
            </div>
          )}

          {onContractStep ? (
            <DeployPanel
              current={isConfigured ? contract : undefined}
              onGoMint={() => go(2)}
            />
          ) : step === 3 ? (
            <RegisterPanel />
          ) : (
            <div className="anim-rise pb-20 sm:pb-0">
              <Chapter
                n="02"
                label="Chọn & mint"
                title="Chọn mèo của bạn"
                desc={
                  <>
                    Ảnh và thuộc tính nhúng thẳng vào tokenURI, không dùng IPFS. Mỗi con
                    chỉ mint được một lần — luật nằm trong contract, không phải giao diện.
                  </>
                }
                aside={
                  <Eyebrow className="text-fg">
                    <span className="font-mono text-2xl tabular-nums tracking-tight">
                      {mintedCount}
                    </span>
                    <span className="text-muted">/ {CATS.length} đã có chủ</span>
                  </Eyebrow>
                }
              />

              <CatGrid
                selected={effective}
                onSelect={choose}
                taken={taken}
                rolling={rolling}
              />
              <MintPanel
                cat={CATS[effective]!}
                catId={effective}
                taken={taken[effective] ?? false}
                onRandom={pickRandom}
                onMinted={handleMinted}
                onMintStart={() => setJustMinted(selected)}
                onRegister={() => go(3)}
              />
              <MyCats />
            </div>
          )}
        </section>
      </main>

      <Footer
        contract={contract}
        isConfigured={isConfigured}
        onViewContract={() => go(1)}
        padBottom={!onContractStep && step === 2}
      />
    </>
  );
}
