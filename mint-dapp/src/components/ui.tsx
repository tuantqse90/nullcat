import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "inverse" | "frost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-avax text-white",
  secondary:
    "bg-ink text-white before:absolute before:inset-y-0 before:left-0 before:z-20 before:w-1 before:bg-avax",
  outline: "border border-line-strong text-fg hover:bg-hover",
  ghost: "text-muted hover:bg-hover hover:text-fg",
  inverse: "border border-white/20 text-white hover:bg-white/10",
  frost: "bg-frost text-ink",
};

const SWEEP: Partial<Record<Variant, { bg: string; text: string }>> = {
  primary: { bg: "bg-frost", text: "hover:text-ink" },
  secondary: { bg: "bg-frost", text: "hover:text-ink" },
  frost: { bg: "bg-ink", text: "hover:text-white" },
};

const SIZES: Record<Size, string> = {
  md: "h-10 justify-center gap-2 px-4 text-[13px]",
  lg: "min-h-[52px] w-full justify-between gap-8 px-6 py-4 text-sm sm:w-auto sm:min-w-[220px]",
};

export function Button({
  variant = "outline",
  size = "md",
  arrow,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
}) {
  const sweep = SWEEP[variant];
  const showArrow = arrow ?? size === "lg";
  return (
    <button
      className={`group relative inline-flex cursor-pointer items-center overflow-hidden font-semibold whitespace-nowrap transition-colors duration-300 disabled:pointer-events-none disabled:opacity-40 ${SIZES[size]} ${VARIANTS[variant]} ${sweep?.text ?? ""} ${className}`}
      {...rest}
    >
      {sweep && (
        <span
          aria-hidden
          className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 ${sweep.bg}`}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {showArrow && <Icon name="arrowRight" className="relative z-10 size-4" />}
    </button>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`border border-line bg-surface-solid ${className}`}>{children}</div>
  );
}

export function Pillar({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-ink text-white ${className}`}>
      {children}
    </div>
  );
}

export function PulseDot({
  color = "bg-avax",
  ping = true,
}: {
  color?: string;
  ping?: boolean;
}) {
  return (
    <span className="relative flex size-1.5 shrink-0">
      {ping && (
        <span
          className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${color}`}
        />
      )}
      <span className={`relative inline-flex size-1.5 rounded-full ${color}`} />
    </span>
  );
}

export function Eyebrow({
  children,
  className = "",
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: ReactNode;
}) {
  return (
    <span className={`eyebrow inline-flex items-center gap-2 text-muted ${className}`}>
      {dot}
      {children}
    </span>
  );
}

export function Chapter({
  n,
  label,
  title,
  desc,
  aside,
}: {
  n?: string;
  label: string;
  title: string;
  desc?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        <Eyebrow>
          {n && <span className="text-avax">{n}</span>}
          {n && " · "}
          {label}
        </Eyebrow>
        <h2 className="display mt-3 text-[1.75rem] text-fg sm:text-3xl md:text-5xl">
          {title}
          <span className="text-avax">.</span>
        </h2>
        {desc && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            {desc}
          </p>
        )}
      </div>
      {aside}
    </div>
  );
}

export function Stat({
  label,
  value,
  dot,
  wrap = false,
  className = "",
  valueClassName = "",
}: {
  label: ReactNode;
  value: ReactNode;
  dot?: ReactNode;
  wrap?: boolean;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 bg-surface-solid px-5 py-4 md:px-6 ${className}`}>
      <span className="eyebrow flex items-center gap-2 font-bold text-muted">
        {dot}
        {label}
      </span>
      <span
        className={`font-mono text-lg tabular-nums tracking-tight text-fg md:text-xl ${wrap ? "break-words" : "truncate"} ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="eyebrow mb-2 block text-muted">{children}</span>;
}

export function Input({
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-11 w-full border border-line bg-surface-solid px-3 font-mono text-base text-fg sm:text-[13px] transition-colors outline-none placeholder:text-muted/60 focus:border-fg read-only:text-muted disabled:text-muted ${className}`}
      {...rest}
    />
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <span className="mt-1.5 block text-xs leading-5 text-muted">{children}</span>;
}

export function Mono({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`font-mono text-[12.5px] break-all ${className}`}>{children}</span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`anim-spin size-3.5 ${className}`} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export type IconName =
  | "check"
  | "alert"
  | "lock"
  | "arrow"
  | "arrowRight"
  | "external"
  | "menu"
  | "x";

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    check: <path d="M3 8.5 6.5 12 13 4.5" />,
    alert: (
      <>
        <path d="M8 2.5 14.5 13.5h-13z" />
        <path d="M8 6.5v3M8 11.6v.1" />
      </>
    ),
    lock: (
      <>
        <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
        <path d="M5.75 7V5.25a2.25 2.25 0 0 1 4.5 0V7" />
      </>
    ),
    arrow: <path d="M3 8h10M9 4l4 4-4 4" />,
    arrowRight: <path d="M3 8h10M9 4l4 4-4 4" />,
    external: (
      <>
        <path d="M9 3h4v4" />
        <path d="M13 3 7.5 8.5" />
        <path d="M12 9.5V13H3V4h3.5" />
      </>
    ),
    menu: <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />,
    x: <path d="M4 4l8 8M12 4l-8 8" />,
  };
  return (
    <svg
      className={`size-3.5 shrink-0 ${className}`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

export function Status({
  tone,
  dark = false,
  children,
}: {
  tone: "ok" | "warn" | "err" | "busy";
  dark?: boolean;
  children: ReactNode;
}) {
  const color =
    tone === "ok"
      ? dark
        ? "text-emerald-400"
        : "text-emerald-600"
      : tone === "warn"
        ? dark
          ? "text-amber-400"
          : "text-amber-600"
        : tone === "err"
          ? dark
            ? "text-red-400"
            : "text-avax"
          : dark
            ? "text-steel"
            : "text-muted";
  return (
    <p className={`flex items-start gap-2 text-[13px] leading-6 ${color}`}>
      <span className="mt-1 shrink-0">
        {tone === "busy" ? <Spinner /> : <Icon name={tone === "ok" ? "check" : "alert"} />}
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}
