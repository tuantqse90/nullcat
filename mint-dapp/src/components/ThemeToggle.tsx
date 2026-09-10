"use client";

import { Icon } from "./ui";

export function ThemeToggle() {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Đổi giao diện sáng / tối"
      className="grid size-9 cursor-pointer place-items-center rounded-md text-muted transition-colors hover:bg-hover hover:text-fg"
    >
      <Icon name="sun" className="size-4 dark:hidden" />
      <Icon name="moon" className="hidden size-4 dark:block" />
    </button>
  );
}
