"use client";

import { useSyncExternalStore } from "react";
import { activeChain } from "./chains";

const KEY = `avaxcats:contract:${activeChain.id}`;
const ENV_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "").trim();

const listeners = new Set<() => void>();
let snapshot: string | undefined;

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

export function useContractAddress() {
  const address = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    address: address as `0x${string}`,
    isConfigured: isAddress(address),
    fromEnv: address !== "" && address === ENV_ADDRESS,
  };
}
