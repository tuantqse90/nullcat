"use client";

import { useSyncExternalStore } from "react";
import { activeChain } from "./chains";

// ❓ Vì sao khoá localStorage có chainId?
// → Contract deploy trên anvil và trên Fuji là hai địa chỉ khác nhau; tách theo chainId để đổi mạng không dùng nhầm.
const KEY = `avaxcats:contract:${activeChain.id}`;
const ENV_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "").trim();

const listeners = new Set<() => void>();
let snapshot: string | undefined;

// ❓ Thứ tự ưu tiên địa chỉ contract là gì?
// → localStorage (contract bạn tự deploy trên web) trước, rồi đến NEXT_PUBLIC_CONTRACT_ADDRESS trong .env.local
//   (contract chung do giảng viên set). try/catch vì localStorage có thể bị chặn (private mode).
function read(): string {
  try {
    return localStorage.getItem(KEY) ?? ENV_ADDRESS;
  } catch {
    return ENV_ADDRESS;
  }
}

function getSnapshot(): string {
  if (snapshot === undefined) snapshot = read();
  return snapshot;
}

function getServerSnapshot(): string {
  return ENV_ADDRESS;
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      snapshot = undefined;
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setDeployedAddress(address: string) {
  try {
    localStorage.setItem(KEY, address);
  } catch {}
  snapshot = address;
  emit();
}

export function clearDeployedAddress() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  snapshot = ENV_ADDRESS;
  emit();
}

export const isAddress = (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v);

// ❓ Vì sao dùng useSyncExternalStore thay vì useState?
// → localStorage nằm ngoài React. Hook này cho React đăng ký lắng nghe (subscribe) và đọc snapshot
//   nhất quán giữa server và client, tránh lỗi hydration khi render tĩnh.
export function useContractAddress() {
  const address = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    address: address as `0x${string}`,
    isConfigured: isAddress(address),
    fromEnv: address !== "" && address === ENV_ADDRESS,
  };
}
