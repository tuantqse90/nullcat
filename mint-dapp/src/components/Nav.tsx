import { CHAIN_LABEL, EXPLORER, FAUCET } from "@/lib/chains";
import { BUILDER_HUB, CONSOLE, DOCS } from "@/lib/links";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Icon } from "./ui";

const LINKS = [
  { label: "Builder Hub", href: BUILDER_HUB },
  { label: "Docs", href: DOCS },
  { label: "Console", href: CONSOLE },
  { label: "Faucet", href: FAUCET },
  ...(EXPLORER ? [{ label: "Snowtrace", href: EXPLORER }] : []),
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line bg-surface backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-5 md:px-6">
        <a href="#" className="flex items-center gap-3 pr-4">
          <Logo className="size-7 text-avax" />
          <span className="font-mono text-[11px] tracking-[0.22em] text-fg">
            AVAXCATS
          </span>
          <span className="hidden font-mono text-[11px] tracking-[0.22em] text-muted lg:inline">
            · BUILDER HUB
          </span>
        </a>

        <ul className="flex items-center gap-1 max-sm:hidden">
          {LINKS.map((l) => (
            <li key={l.label} className="list-none">
              <a
                className="inline-flex items-center rounded-md p-2 text-sm text-muted transition-colors hover:text-fg"
                href={l.href}
                target="_blank"
                rel="noreferrer"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="grow" />

        <span className="eyebrow hidden border border-line px-2.5 py-1.5 text-muted sm:inline-block">
          {CHAIN_LABEL}
        </span>
        <ThemeToggle />

        <details className="group sm:hidden">
          <summary
            className="grid size-9 cursor-pointer list-none place-items-center rounded-md text-muted transition-colors hover:bg-hover hover:text-fg"
            aria-label="Open menu"
          >
            <Icon name="menu" className="size-4 group-open:hidden" />
            <Icon name="x" className="hidden size-4 group-open:block" />
          </summary>
          <div className="absolute inset-x-0 top-14 border-b border-line bg-surface-solid px-5 py-3 shadow-lg">
            <span className="eyebrow mb-1 flex items-center gap-2 px-2 py-2 text-muted">
              <span className="size-1.5 rounded-full bg-avax" />
              {CHAIN_LABEL}
            </span>
            {LINKS.map((l) => (
              <a
                key={l.label}
                className="flex items-center justify-between px-2 py-3 text-[15px] text-fg transition-colors hover:bg-hover"
                href={l.href}
                target="_blank"
                rel="noreferrer"
              >
                {l.label}
                <Icon name="external" className="size-3.5 text-muted" />
              </a>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
