"use client";

import { CHAIN_LABEL, EXPLORER, FAUCET, isLocal } from "@/lib/chains";
import { explorerAddress } from "@/lib/contract";
import { clearDeployedAddress } from "@/lib/deployed";
import {
  ACADEMY,
  BUILDER_HUB,
  CONSOLE,
  DOCS,
  GITHUB,
  NETWORK_STATUS,
  TELEGRAM_BUILDERS,
  TELEGRAM_COMMUNITY,
  X_ACCOUNT,
} from "@/lib/links";
import { Logo } from "./Logo";
import { Icon, PulseDot } from "./ui";

type Props = {
  contract?: string;
  isConfigured: boolean;
  onViewContract: () => void;
  padBottom?: boolean;
};

function FooterLink({
  href,
  children,
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const cls =
    "group inline-flex w-fit cursor-pointer items-center gap-1 text-left text-sm text-muted transition-colors hover:text-fg";
  if (href) {
    const ext = /^https?:/.test(href);
    return (
      <a className={cls} href={href} target={ext ? "_blank" : undefined} rel={ext ? "noreferrer" : undefined}>
        {children}
        {ext && <Icon name="external" className="size-3 opacity-60 transition-opacity group-hover:opacity-100" />}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

export function Footer({ contract, isConfigured, onViewContract, padBottom = false }: Props) {
  const explorer = isConfigured && contract ? explorerAddress(contract) : null;

  return (
    <footer className={`mt-24 border-t border-line bg-surface-solid ${padBottom ? "pb-16 sm:pb-0" : ""}`}>
      <div className="mx-auto w-full max-w-7xl px-5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
          <div className="flex items-center gap-3">
            <Logo className="size-6 text-fg" />
            <span className="font-mono text-[11px] tracking-[0.22em] text-fg">
              AVAXCATS · BUILDER HUB
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="eyebrow inline-flex items-center gap-2 text-muted">
              <PulseDot
                color={isConfigured ? "bg-emerald-500" : "bg-zinc-400"}
                ping={isConfigured}
              />
              {isConfigured ? "Contract live" : "No contract yet"}
            </span>
            {!isLocal && (
              <a
                href={NETWORK_STATUS}
                target="_blank"
                rel="noreferrer"
                className="eyebrow inline-flex items-center gap-2 text-muted transition-colors hover:text-fg"
              >
                <PulseDot color="bg-emerald-500" />
                Network status
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col bg-surface-solid py-8 pr-5">
            <h3 className="eyebrow mb-5 text-muted">Avalanche</h3>
            <ul className="flex flex-col gap-2.5">
              <li><FooterLink href={BUILDER_HUB}>Builder Hub</FooterLink></li>
              <li><FooterLink href={ACADEMY}>Academy</FooterLink></li>
              <li><FooterLink href={DOCS}>Documentation</FooterLink></li>
              <li><FooterLink href={CONSOLE}>Console</FooterLink></li>
              <li><FooterLink href={FAUCET}>Testnet faucet</FooterLink></li>
              {EXPLORER && <li><FooterLink href={EXPLORER}>Snowtrace</FooterLink></li>}
            </ul>
          </div>

          <div className="flex flex-col bg-surface-solid py-8 sm:px-5">
            <h3 className="eyebrow mb-5 text-muted">Contract</h3>
            <ul className="flex flex-col gap-2.5">
              {isConfigured && contract ? (
                <>
                  <li>
                    {explorer ? (
                      <FooterLink href={explorer}>
                        <span className="font-mono text-xs break-all">{contract}</span>
                      </FooterLink>
                    ) : (
                      <span className="font-mono text-xs break-all text-muted">{contract}</span>
                    )}
                  </li>
                  <li><FooterLink onClick={onViewContract}>View contract</FooterLink></li>
                  <li><FooterLink onClick={clearDeployedAddress}>Deploy another contract</FooterLink></li>
                </>
              ) : (
                <li><FooterLink onClick={onViewContract}>Deploy contract</FooterLink></li>
              )}
            </ul>
          </div>

          <div className="flex flex-col bg-surface-solid py-8 sm:pr-5 lg:px-5">
            <h3 className="eyebrow mb-5 text-muted">Network</h3>
            <ul className="flex flex-col gap-2.5 text-sm text-muted">
              <li>{CHAIN_LABEL}</li>
              <li>Testnet only — nothing here has real value</li>
              {isLocal && <li>Stopping anvil wipes all state</li>}
            </ul>
          </div>

          <div className="flex flex-col bg-surface-solid py-8 sm:px-5">
            <h3 className="eyebrow mb-5 text-muted">Team1 VN</h3>
            <ul className="flex flex-col gap-2.5 text-sm text-muted">
              <li>Team Avalanche · Team1 VN</li>
              <li><FooterLink href={TELEGRAM_COMMUNITY}>Telegram · Avalanche VN community</FooterLink></li>
              <li><FooterLink href={TELEGRAM_BUILDERS}>Telegram · Team1 VN builders</FooterLink></li>
              <li><FooterLink href={X_ACCOUNT}>X @Team1VN</FooterLink></li>
              <li><FooterLink href={GITHUB}>GitHub · source code</FooterLink></li>
              <li>
                Generator <code className="font-mono text-xs text-fg">nullcat</code>
              </li>
            </ul>
          </div>
        </div>

        <div className="eyebrow flex flex-wrap items-center justify-between gap-2 border-t border-line py-6 text-muted">
          <span>© 2026 Team1 VN</span>
          <span className="flex flex-wrap gap-x-5 gap-y-1">
            <a className="transition-colors hover:text-fg" href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer">Community</a>
            <a className="transition-colors hover:text-fg" href={TELEGRAM_BUILDERS} target="_blank" rel="noreferrer">Builders</a>
            <a className="transition-colors hover:text-fg" href={X_ACCOUNT} target="_blank" rel="noreferrer">X</a>
            <a className="transition-colors hover:text-fg" href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
            <span>Built on Avalanche</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
