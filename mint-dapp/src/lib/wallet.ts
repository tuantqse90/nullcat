"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useConnectors } from "wagmi";

const noop = () => () => {};

export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

function detectMobile() {
  if (typeof navigator === "undefined") return false;
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (matchMedia("(pointer: coarse)").matches && window.innerWidth < 1024)
  );
}

export function useIsMobile() {
  return useSyncExternalStore(noop, detectMobile, () => false);
}

type EthWindow = { ethereum?: unknown };

export function useHasInjected() {
  const connectors = useConnectors();
  const mounted = useMounted();
  const [, bump] = useState(0);

  useEffect(() => {
    const on = () => bump((n) => n + 1);
    window.addEventListener("ethereum#initialized", on);
    window.addEventListener("eip6963:announceProvider", on);
    const t = setTimeout(on, 1500);
    return () => {
      window.removeEventListener("ethereum#initialized", on);
      window.removeEventListener("eip6963:announceProvider", on);
      clearTimeout(t);
    };
  }, []);

  if (!mounted) return false;
  const injectedFound = !!(window as unknown as EthWindow).ethereum;
  const discovered = connectors.some(
    (c) => c.type === "injected" && c.id !== "injected",
  );
  return injectedFound || discovered;
}

export function currentUrl() {
  return typeof window === "undefined" ? "https://team1vn.xyz" : window.location.href;
}

export function metamaskDeepLink() {
  if (typeof window === "undefined") return "https://metamask.app.link/dapp/team1vn.xyz";
  const { host, pathname, search } = window.location;
  return `https://metamask.app.link/dapp/${host}${pathname}${search}`;
}
