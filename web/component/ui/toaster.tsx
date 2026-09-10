"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return <SonnerToaster
    position="top-right"
    theme={resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "system"}
    duration={4500}
    closeButton
    richColors
    visibleToasts={3}
    gap={12}
    offset={24}
    mobileOffset={16}
    containerAriaLabel="通知"
    toastOptions={{
      closeButtonAriaLabel: "通知を閉じる",
      style: { borderRadius: "14px", fontFamily: "inherit" },
    }}
  />;
}
