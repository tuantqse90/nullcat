"use client";

import { CATS } from "@/lib/cats";
import { Icon } from "./ui";

type Props = {
  selected: number;
  onSelect: (i: number) => void;
  // ❓ Sao nhận taken từ props thay vì tự đọc contract?
  // → CatGrid chỉ là UI thuần. Việc đọc mintedBitmap đặt ở page (useMintedCats trong lib/minted.ts) để CatGrid, MintPanel
  //   và SupplyBadge dùng chung một nguồn, tránh mỗi component tự gọi RPC riêng.
  taken: boolean[];
  rolling?: boolean;
};

export function CatGrid({ selected, onSelect, taken, rolling }: Props) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-px border border-line bg-surface-solid">
      {CATS.map((cat, i) => {
        // ❓ Vì sao dùng index i làm catId thay vì một id trong dữ liệu?
        // → Contract đánh số cat theo đúng thứ tự trong CATS (0..47) và bitmap cũng theo index đó; selected/onSelect/taken
        //   đều dùng chung index này nên phải nhất quán, đổi thứ tự CATS là mint sai con.
        const on = i === selected;
        // ❓ Cat này "đã bị mint" được xác định thế nào?
        // → taken là boolean[] do useMintedCats tạo từ mintedBitmap: bit thứ i của uint256 = 1 nghĩa là catId i đã mint.
        //   `?? false` phòng lúc bitmap chưa tải xong (taken rỗng) → mọi cat coi như còn trống thay vì undefined.
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
