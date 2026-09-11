"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useConnectors } from "wagmi";

const noop = () => () => {};

// ❓ Hook "mounted" này hoạt động ra sao?
// → useSyncExternalStore với subscribe rỗng (noop): khi SSR getServerSnapshot → false, trong browser getSnapshot → true.
//   Kết quả: lần render hydrate là false, sau đó là true — không cần useEffect + setState và không gây hydration mismatch.
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

// ❓ Phát hiện mobile bằng cách nào?
// → Hai tín hiệu: userAgent chứa Android/iPhone/iPad/iPod, HOẶC con trỏ "coarse" (màn hình cảm ứng) và màn hẹp hơn
//   1024px (bắt iPad giả dạng desktop trong userAgent). Guard `typeof navigator` vì hàm này cũng bị gọi khi SSR.
function detectMobile() {
  if (typeof navigator === "undefined") return false;
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (matchMedia("(pointer: coarse)").matches && window.innerWidth < 1024)
  );
}

// ❓ Sao không gọi detectMobile() thẳng trong component?
// → Server không có navigator → phải trả false khi SSR (tham số thứ 3), rồi browser mới tính lại. Gọi thẳng sẽ làm
//   HTML server và client khác nhau → lỗi hydration.
export function useIsMobile() {
  return useSyncExternalStore(noop, detectMobile, () => false);
}

type EthWindow = { ethereum?: unknown };

export function useHasInjected() {
  const connectors = useConnectors();
  const mounted = useMounted();
  // ❓ useState với "bump" để làm gì khi không dùng giá trị?
  // → Mẹo ép component render lại: mỗi lần ví "xuất hiện" ta gọi bump(n + 1) → React render lại và đọc window.ethereum
  //   thêm một lần nữa.
  const [, bump] = useState(0);

  // ❓ Sao phải lắng nghe event mà không đọc window.ethereum một lần là xong?
  // → Extension ví inject window.ethereum KHÔNG đồng bộ, có thể sau khi React render xong. MetaMask phát
  //   "ethereum#initialized", ví hiện đại phát "eip6963:announceProvider" (EIP-6963: nhiều ví cùng tồn tại không giành
  //   nhau window.ethereum). setTimeout 1500ms là lưới an toàn cho ví không phát event; cleanup gỡ listener khi unmount.
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

  // ❓ Vì sao return false khi chưa mounted?
  // → Trên server không có window (đọc window.ethereum sẽ crash "window is not defined"), và lần render hydrate phải
  //   cho ra cùng kết quả với server.
  if (!mounted) return false;
  // ❓ Hai cách phát hiện ví khác nhau chỗ nào?
  // → injectedFound: cách cũ — ví ghi đè window.ethereum. discovered: cách mới — wagmi lắng nghe EIP-6963 và tạo connector
  //   riêng cho từng ví (id ≠ "injected"). Lấy OR để hỗ trợ cả ví cũ lẫn mới; cả hai false → không hiện "Connect wallet".
  const injectedFound = !!(window as unknown as EthWindow).ethereum;
  const discovered = connectors.some(
    (c) => c.type === "injected" && c.id !== "injected",
  );
  return injectedFound || discovered;
}

export function currentUrl() {
  return typeof window === "undefined" ? "https://team1vn.xyz" : window.location.href;
}

// ❓ Deep link MetaMask hoạt động thế nào?
// → https://metamask.app.link/dapp/<host+path> mở app MetaMask trên điện thoại và nạp trang này trong browser nội bộ
//   của ví, nơi window.ethereum có sẵn. Guard window để SSR không crash; fallback là domain production.
export function metamaskDeepLink() {
  if (typeof window === "undefined") return "https://metamask.app.link/dapp/team1vn.xyz";
  const { host, pathname, search } = window.location;
  return `https://metamask.app.link/dapp/${host}${pathname}${search}`;
}
