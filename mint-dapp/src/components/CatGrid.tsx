"use client";

import { CATS } from "@/lib/cats";
import { Icon } from "./ui";

type Props = {
  selected: number;
  onSelect: (i: number) => void;
  taken: boolean[];
  rolling?: boolean;
};

export function CatGrid({ selected, onSelect, taken, rolling }: Props) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-px border border-line bg-surface-solid">
      {CATS.map((cat, i) => {
        const on = i === selected;
        const gone = taken[i] ?? false;
        return (
          <button
            key={cat.name}
            type="button"
            title={gone ? `${cat.name} — already minted` : cat.name}
            aria-pressed={on}
            onClick={() => onSelect(i)}
            className={`relative cursor-pointer p-1.5 transition-colors duration-150 ${
              on
                ? "z-10 bg-surface-solid outline-2 outline-avax"
                : gone
                  ? "bg-surface-solid outline-1 outline-line"
                  : "bg-surface-solid outline-1 outline-line hover:bg-hover"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={`px w-full transition-opacity duration-150 ${
                gone ? "opacity-25 grayscale" : rolling ? "opacity-90" : ""
              }`}
              src={cat.image}
              alt={cat.name}
            />
            {gone && (
              <span className="pointer-events-none absolute inset-0 grid place-items-center text-muted">
                <Icon name="lock" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
