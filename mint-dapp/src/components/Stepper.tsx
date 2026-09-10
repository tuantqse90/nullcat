"use client";

import { Icon } from "./ui";

const STEPS = [
  { label: "Contract", short: "Contract" },
  { label: "Chọn & mint", short: "Mint" },
  { label: "Đăng ký", short: "Đăng ký" },
] as const;

export function Stepper({
  current,
  done,
  onGo,
}: {
  current: 1 | 2 | 3;
  done: number;
  onGo: (n: 1 | 2 | 3) => void;
}) {
  return (
    <nav
      className="grid grid-cols-3 gap-px border border-line bg-line"
      aria-label="Các bước"
    >
      {STEPS.map(({ label, short }, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = current === n;
        const complete = n <= done;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onGo(n)}
            aria-current={active ? "step" : undefined}
            className={`relative flex min-w-0 cursor-pointer flex-col items-start gap-1.5 bg-surface-solid px-3 py-3 text-left transition-colors hover:bg-hover sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-4 ${
              active
                ? "text-fg after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-avax"
                : "text-muted"
            }`}
          >
            <span
              className={`inline-flex w-6 shrink-0 items-center font-mono text-[11px] tracking-[0.18em] ${
                active ? "text-avax" : complete ? "text-emerald-500" : ""
              }`}
            >
              {complete && !active ? <Icon name="check" className="size-3.5" /> : `0${n}`}
            </span>
            <span className="eyebrow w-full truncate">
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
