"use client";

import { useSyncExternalStore } from "react";
import { activeChain } from "./chains";

export const KPI_ENDPOINT = (process.env.NEXT_PUBLIC_KPI_ENDPOINT ?? "").trim();
export const hasKpiEndpoint = /^https?:\/\//.test(KPI_ENDPOINT);

export type KpiPayload = {
  name: string;
  contact: string; // Gmail (registered on Builder Hub)
  telegram: string;
  x: string; // Account X (Twitter)
  wallet: string;
  contract: string;
  l1: string;
  chain: string;
  chainId: number;
  minted: number;
  at: string;
};

export type KpiRecord = KpiPayload & { confirmed: boolean };

const KEY = `avaxcats:kpi:${activeChain.id}`;

const listeners = new Set<() => void>();
let snapshot: string | undefined;

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  if (snapshot === undefined) snapshot = read();
  return snapshot;
}

function getServerSnapshot() {
  return "";
}

export function useKpiSubmitted() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as KpiRecord;
  } catch {
    return null;
  }
}

function remember(payload: KpiPayload, confirmed: boolean) {
  const raw = JSON.stringify({ ...payload, confirmed });
  try {
    localStorage.setItem(KEY, raw);
  } catch {}
  snapshot = raw;
  for (const l of listeners) l();
}

export function forgetKpi() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  snapshot = "";
  for (const l of listeners) l();
}

export type SubmitResult = { ok: true; confirmed: boolean } | { ok: false; reason: string };

export async function submitKpi(payload: KpiPayload): Promise<SubmitResult> {
  if (!hasKpiEndpoint) {
    return { ok: false, reason: "NEXT_PUBLIC_KPI_ENDPOINT is not set in .env.local" };
  }

  const body = JSON.stringify(payload);

  try {
    const res = await fetch(KPI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "manual",
    });
    if (res.type === "opaqueredirect" || res.ok) {
      remember(payload, true);
      return { ok: true, confirmed: true };
    }
    return { ok: false, reason: `Server returned HTTP ${res.status}` };
  } catch {
    try {
      await fetch(KPI_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body,
      });
      remember(payload, false);
      return { ok: true, confirmed: false };
    } catch (e) {
      return { ok: false, reason: (e as Error).message || "could not send" };
    }
  }
}
